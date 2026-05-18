import asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from dotenv import load_dotenv
load_dotenv()

from core.kinematics import compute_subject_metrics
from core.llm import generate_comparative_summary

app = FastAPI(title="LocoMetrics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_csv_from_upload(contents: bytes) -> pd.DataFrame:
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return pd.read_csv(io.StringIO(contents.decode(enc)))
        except UnicodeDecodeError:
            continue
    raise ValueError("Unable to decode uploaded file.")


def _to_revs(series: pd.Series) -> pd.Series:
    """
    Convert cumulative wheel counts to per-row revolutions.
    Assumes the input is a cumulative counter series.
    """
    s = pd.to_numeric(series, errors="coerce").fillna(0).astype(float)

    if s.empty:
        return s

    revs = s.diff()
    
    # Force the first row to be 0 so we don't ingest massive starting counts
    revs.iloc[0] = 0
    revs = revs.clip(lower=0)

    return revs


def _numeric_candidates(df: pd.DataFrame, exclude: set[str]) -> list[str]:
    cols = []
    for c in df.columns:
        if c in exclude:
            continue
        numeric = pd.to_numeric(df[c], errors="coerce")
        if numeric.notna().any():
            cols.append(c)
    return cols


@app.post("/api/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    tsCol: str = Form(...),
    subjCol: str = Form(...),
    lightS: int = Form(...),
    lightE: int = Form(...)
):
    try:
        contents = await file.read()
        df = _read_csv_from_upload(contents)

        if tsCol not in df.columns:
            raise ValueError(f"Timestamp column '{tsCol}' not found.")

        df = df.copy()
        df["timestamp"] = pd.to_datetime(df[tsCol], errors="coerce")
        df = df.dropna(subset=["timestamp"]).sort_values("timestamp")

        if df.empty:
            raise ValueError("No valid timestamps found in the uploaded file.")

        subjects = {}
        warnings = []  

        if subjCol == "__none__":
            sensor_cols = _numeric_candidates(df, exclude={tsCol, "timestamp"})
            if not sensor_cols:
                raise ValueError("No numeric sensor columns found.")

            for sensor in sensor_cols:
                revs = _to_revs(df[sensor])
                metric_df = pd.DataFrame(
                    {
                        "timestamp": df["timestamp"].values,
                        "revs": revs.values,
                    }
                )
                metrics = compute_subject_metrics(metric_df, lightS, lightE)
                if metrics:
                    subjects[sensor] = {"metrics": metrics}
        else:
            if subjCol not in df.columns:
                raise ValueError(f"Subject column '{subjCol}' not found.")

            for subj_id, grp in df.groupby(subjCol):
                grp = grp.copy()

                value_cols = _numeric_candidates(
                    grp,
                    exclude={tsCol, "timestamp", subjCol}
                )

                # Skip bad subjects instead of aborting the whole request.
                if not value_cols:
                    warnings.append(
                        f"Subject '{subj_id}' skipped: no numeric activity column found."
                    )
                    continue

                value_col = value_cols[0]
                revs = _to_revs(grp[value_col])

                metric_df = pd.DataFrame(
                    {
                        "timestamp": grp["timestamp"].values,
                        "revs": revs.values,
                    }
                )
                metrics = compute_subject_metrics(metric_df, lightS, lightE)
                if metrics:
                    subjects[str(subj_id)] = {
                        "metrics": metrics,
                        "valueCol": value_col,   
                    }

        if not subjects:
            raise ValueError("No valid activity found in this file.")

        return {
            "fileName": file.filename,
            "subjects": subjects,
            "lightS": lightS,
            "lightE": lightE,
            "warnings": warnings,  
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/summarize")
async def summarize_comparison(request: Request):
    try:
        data = await request.json()
        
        # AUTO-RETRY LOGIC: Silently retry up to 3 times if the LLM servers are busy
        for attempt in range(3):
            try:
                summary = await generate_comparative_summary(data)
                
                # If LLM returned a 503 string without throwing an exception
                if isinstance(summary, str) and ("503" in summary or "429" in summary or "UNAVAILABLE" in summary):
                    if attempt < 2:
                        await asyncio.sleep(2) # Wait 2 seconds and try again
                        continue
                        
                return {"summary": summary}
                
            except Exception as e:
                # If an actual Exception was raised by the LLM client
                if ("503" in str(e) or "429" in str(e) or "UNAVAILABLE" in str(e)) and attempt < 2:
                    await asyncio.sleep(2) # Wait 2 seconds and try again
                    continue
                # If out of retries, throw to the frontend
                if attempt == 2:
                    raise e
                
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))