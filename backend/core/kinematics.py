import pandas as pd
import numpy as np
import math

# Exact dynamic circumference calculation (pi * 0.18)
CIRC_M = math.pi * 0.18  
GAP_THRESHOLD_SEC = 10  # new bout if the gap since last active row is larger than this


def _estimate_sample_sec(ts: pd.Series) -> float:
    diffs = ts.sort_values().diff().dt.total_seconds()
    positive = diffs[diffs > 0]
    if positive.empty:
        return 1.0
    return float(positive.median())


def compute_subject_metrics(df: pd.DataFrame, lightS: int, lightE: int) -> dict:
    expected = {"timestamp", "revs"}
    if df.empty or not expected.issubset(df.columns):
        return {
            "distanceKm": 0,
            "activeDurMin": 0,
            "boutCount": 0,
            "meanSpeed": 0,
            "peakSpeed": 0,
            "hourly": []
        }

    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["revs"] = pd.to_numeric(df["revs"], errors="coerce").fillna(0).astype(float)
    df = df.dropna(subset=["timestamp"]).sort_values("timestamp")

    if df.empty:
        return {
            "distanceKm": 0,
            "activeDurMin": 0,
            "boutCount": 0,
            "meanSpeed": 0,
            "peakSpeed": 0,
            "hourly": []
        }

    df = df.set_index("timestamp")

    # REMOVED the .diff() and zero-state logic here. 
    # Your Arduino data is instantaneous, so we process it exactly as it comes in.

    # Estimate the usual sampling interval from the data itself.
    sample_sec = _estimate_sample_sec(df.index.to_series())
    if sample_sec <= 0:
        sample_sec = 1.0

    # Realistic Hardware Bounce Filter (Tau_noise = 0.1s)
    # Filters out double-counts from a single physical magnet pass, 
    # but allows realistic running speeds to pass through.
    df["time_delta"] = df.index.to_series().diff().dt.total_seconds().fillna(0.1)
    df["is_active"] = (df["revs"] > 0) & (df["time_delta"] >= 0.1)

    # Measure gap since the last *active* row for bout fragmentation logic
    last_active_ts = df.index.to_series().where(df["is_active"]).shift(1).ffill()
    gap_since_active_sec = (
        (df.index.to_series() - last_active_ts)
        .dt.total_seconds()
        .fillna(float("inf"))   # NaN = no prior active row → always a new bout
        .clip(lower=0)
    )
    df["bout_start"] = df["is_active"] & (gap_since_active_sec > GAP_THRESHOLD_SEC)
    df["bout_id"] = df["bout_start"].cumsum()

    # Revolutions to distance
    df["distance_m"] = df["revs"] * CIRC_M
    total_distance_km = float(df["distance_m"].sum() / 1000.0)

    # Peak Speed (Resampled for continuous time + converted to m/min)
    try:
        # Resample to 1-second bins to prevent event-driven dilution
        dist_1s = df["distance_m"].resample("1s").sum().fillna(0)
        # rolling(10).mean() gives meters/second. Multiply by 60 for meters/minute.
        peak_speed_mmin = float((dist_1s.rolling(10).mean() * 60.0).max())
        if pd.isna(peak_speed_mmin):
            peak_speed_mmin = 0.0
    except Exception:
        peak_speed_mmin = 0.0

    # Active duration is based on active samples
    active_rows = df["is_active"].sum()
    active_duration_sec = float(active_rows * sample_sec)
    active_duration_min = active_duration_sec / 60.0

    bout_count = int(df["bout_start"].sum())

    if active_duration_sec > 0:
        mean_speed = float((total_distance_km * 1000.0) / (active_duration_sec / 60.0))
    else:
        mean_speed = 0.0

    hourly_list = []
    
    for hour_ts, group in df.resample("1h"):
        h_hour = hour_ts.hour

        if lightS < lightE:
            is_light = lightS <= h_hour < lightE
        else:
            is_light = h_hour >= lightS or h_hour < lightE

        if group.empty:
            hourly_list.append({
                "label": hour_ts.strftime("%b %d, %H:00"),
                "distanceKm": 0.0,
                "activeDurMin": 0.0,
                "boutCount": 0,
                "meanSpeed": 0.0,
                "peakSpeed": 0.0,
                "isLight": bool(is_light),
            })
            continue

        h_distance_km = float(group["distance_m"].sum() / 1000.0)
        h_active_rows = int(group["is_active"].sum())
        h_active_sec = float(h_active_rows * sample_sec)
        h_active_min = h_active_sec / 60.0
        h_bout_count = int(group["bout_start"].sum())

        # Hourly Mean Speed (m/min)
        if h_active_sec > 0:
            h_mean_speed = float((h_distance_km * 1000.0) / (h_active_sec / 60.0))
        else:
            h_mean_speed = 0.0

        # Hourly Peak Speed (m/min)
        try:
            h_dist_1s = group["distance_m"].resample("1s").sum().fillna(0)
            h_peak_speed_mmin = float((h_dist_1s.rolling(10).mean() * 60.0).max())
            if pd.isna(h_peak_speed_mmin):
                h_peak_speed_mmin = 0.0
        except Exception:
            h_peak_speed_mmin = 0.0

        hourly_list.append({
            "label": hour_ts.strftime("%b %d, %H:00"),
            "distanceKm": h_distance_km,
            "activeDurMin": h_active_min,
            "boutCount": h_bout_count,
            "meanSpeed": h_mean_speed,
            "peakSpeed": h_peak_speed_mmin,
            "isLight": bool(is_light),
        })

    return {
        "distanceKm": total_distance_km,
        "activeDurMin": float(active_duration_min),
        "boutCount": bout_count,
        "meanSpeed": float(mean_speed),
        "peakSpeed": float(peak_speed_mmin),
        "hourly": hourly_list
    }