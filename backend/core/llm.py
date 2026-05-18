import os
import json
import asyncio
from typing import Dict, Any
from google import genai

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1 (CRITICAL): NEVER hardcode API keys in source code.
#
# HOW TO SET UP:
#   Option A — .env file (recommended for local dev):
#     1. Create a file called  .env  in your backend/ folder
#     2. Add this line:  GEMINI_API_KEY=your_real_key_here
#     3. pip install python-dotenv
#     4. Add to the top of main.py:
#          from dotenv import load_dotenv; load_dotenv()
#
#   Option B — shell export (for servers / CI):
#     export GEMINI_API_KEY="your_real_key_here"
#
# YOUR OLD KEY IS NOW COMPROMISED — revoke it immediately at:
#   https://console.cloud.google.com → APIs & Services → Credentials
# ─────────────────────────────────────────────────────────────────────────────
_API_KEY = os.environ.get("GEMINI_API_KEY", "")
client   = genai.Client(api_key=_API_KEY) if _API_KEY else None

# Retry / timeout config
_MAX_RETRIES    = 3
_BACKOFF_BASE   = 2   # seconds: waits 2s, 4s, 8s between retries
_REQUEST_TIMEOUT = 90 # seconds: give up if Gemini hasn't responded


def _build_prompt(payload: Dict[str, Any]) -> str:
    """
    FIX 3: Pre-summarise the payload before sending to the LLM.

    The raw hourly array (24 objects × N subjects × N days) wastes ~98% of
    prompt tokens on data the model never references at the hour level.
    We collapse each day to: totalKm, lightKm, darkKm, boutCount, meanSpeed
    and pass that compact structure instead.
    """
    lightS = payload.get("lightS", 7)
    lightE = payload.get("lightE", 19)

    compact_files = []

    # Support both single-file format {subjects:...} and multi-file format {files:[...]}
    raw_files = payload.get("files") or [payload]

    for file_data in raw_files:
        file_name = file_data.get("fileName", "unknown")
        compact_subjects = {}

        for subj_id, subj_data in file_data.get("subjects", {}).items():
            metrics  = subj_data.get("metrics", {})
            hourly   = metrics.get("hourly", [])

            # Aggregate hourly → per-day summaries
            days: Dict[str, Dict] = {}
            for h in hourly:
                label    = h.get("label", "")
                day_key  = label.split(",")[0] if "," in label else label[:6]
                is_light = h.get("isLight", False)

                if day_key not in days:
                    days[day_key] = {
                        "totalKm"    : 0.0,
                        "lightKm"    : 0.0,
                        "darkKm"     : 0.0,
                        "boutCount"  : 0,
                        "activeDurMin": 0.0,
                        "speedReadings": [],
                    }
                d = days[day_key]
                km = h.get("distanceKm", 0.0)
                d["totalKm"]      += km
                d["boutCount"]    += h.get("boutCount", 0)
                d["activeDurMin"] += h.get("activeDurMin", 0.0)
                if h.get("meanSpeed", 0) > 0:
                    d["speedReadings"].append(h["meanSpeed"])
                if is_light:
                    d["lightKm"] += km
                else:
                    d["darkKm"]  += km

            # Compute per-day mean speed and nocturnal %
            day_summaries = {}
            for day_key, d in days.items():
                total = d["totalKm"]
                day_summaries[day_key] = {
                    "totalKm"      : round(total, 3),
                    "lightKm"      : round(d["lightKm"], 3),
                    "darkKm"       : round(d["darkKm"], 3),
                    "boutCount"    : d["boutCount"],
                    "activeDurMin" : round(d["activeDurMin"], 1),
                    "meanSpeedMpm" : round(
                        sum(d["speedReadings"]) / len(d["speedReadings"]), 2
                    ) if d["speedReadings"] else 0.0,
                    "nocturnalPct" : round(
                        (d["darkKm"] / total * 100) if total > 0 else 0, 1
                    ),
                }

            # Overall metrics
            compact_subjects[subj_id] = {
                "overall": {
                    "totalDistanceKm" : round(metrics.get("distanceKm", 0), 3),
                    "activeDurMin"    : round(metrics.get("activeDurMin", 0), 1),
                    "boutCount"       : metrics.get("boutCount", 0),
                    "meanSpeedMpm"    : round(metrics.get("meanSpeed", 0), 2),
                },
                "dailyBreakdown": day_summaries,
            }

        compact_files.append({"fileName": file_name, "subjects": compact_subjects})

    compact_payload = {
        "lightPhase"  : f"{lightS:02d}:00–{lightE:02d}:00",
        "darkPhase"   : f"{lightE:02d}:00–{lightS:02d}:00 (next day)",
        "files"       : compact_files,
    }

    return f"""
You are an expert preclinical neuroscientist analysing locomotor behaviour in rodents.
Review the following circadian locomotor data across multiple days and subjects.
All distances are in km; speeds are in m/min.

Data:
{json.dumps(compact_payload, indent=2)}

Write a concise, professional comparative summary covering:

1. **Overall Activity & Locomotor Volume**: Compare total distance across subjects. 
   Identify high/low performers and quantify the differences.

2. **Circadian Rhythm & Nocturnal Adherence**: Analyse the light vs. dark phase 
   distribution (nocturnalPct). Flag any subjects showing unusual daytime activity. 
   Discuss the health of circadian entrainment.

3. **Longitudinal Trends**: Analyse progression across days. Is there gradual decay 
   (habituation/fatigue), escalation, or stable behaviour?

4. **Outliers & Anomalies**: Call out sudden drops, spikes, or erratic bout patterns 
   on specific days.

Structure your response with clear professional paragraphs. Be as descriptive and 
analytical as necessary. Keep the tone strictly academic and scientific.
""".strip()


async def generate_comparative_summary(payload: Dict[str, Any]) -> str:
    """
    Sends multi-day, multi-subject locomotor metrics to Gemini AI and returns
    a structured comparative behavioural summary.
    """
    # FIX 5: Validate input before touching the API
    if not client:
        return (
            "AI Module Offline: Set the GEMINI_API_KEY environment variable. "
            "See backend/core/llm.py for setup instructions."
        )

    raw_files = payload.get("files") or [payload]
    total_subjects = sum(
        len(f.get("subjects", {})) for f in raw_files
    )
    if total_subjects == 0:
        return "AI Error: No subject data found in the payload. Please analyse a file first."

    prompt = _build_prompt(payload)

    # FIX 2 + 4: Exponential backoff across 3 attempts, each with a hard timeout
    last_error = ""
    for attempt in range(_MAX_RETRIES):
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.5-flash",
                    contents=prompt,
                ),
                timeout=_REQUEST_TIMEOUT,
            )
            return response.text

        except asyncio.TimeoutError:
            last_error = f"Request timed out after {_REQUEST_TIMEOUT}s."
            # Timeouts are not quota issues — no point retrying immediately
            break

        except Exception as e:
            err_msg = str(e)
            is_rate_limit = (
                "429" in err_msg
                or "quota" in err_msg.lower()
                or "exhausted" in err_msg.lower()
                or "resource_exhausted" in err_msg.lower()
            )

            if is_rate_limit and attempt < _MAX_RETRIES - 1:
                wait_sec = _BACKOFF_BASE ** (attempt + 1)  # 2s, 4s, 8s
                print(f"[llm] Rate limit hit (attempt {attempt + 1}). Retrying in {wait_sec}s…")
                await asyncio.sleep(wait_sec)
                last_error = err_msg
                continue

            last_error = err_msg
            break

    # All attempts failed
    if "timed out" in last_error:
        return "AI Error: Gemini did not respond within 90 seconds. Please try again."
    if "429" in last_error or "quota" in last_error.lower():
        return "AI Error: Gemini quota exhausted after 3 retries. Please wait a few minutes."
    return f"AI Generation Failed: {last_error}"