"""
one_hz_resolution_check.py  —  ΔV-LAP
Checks how the 1-s reporting interval affects active duration and mean speed.

Part 1 (no input needed): simulates steady wheel rotation at known speeds,
bins the revolutions into 1-s intervals exactly as the logger does, and applies
(a) the ΔV-LAP rule (active time = 1-s intervals with >= 1 revolution) and
(b) a gap-bridged rule (pauses of <= 2 s between revolutions count as running).
Reproduces Supplementary 12. Fixed random seed -> identical output every run.

Part 2 (optional): the same checks on a real recording, e.g.
    python one_hz_resolution_check.py Continuous_Observation.csv
(timestamp column + one cumulative-count column per sensor).

Wheel: 18-cm saucer, circumference = pi * 0.18 m. One revolution in 1 s = 33.9 m/min.
"""
import sys
import numpy as np
import pandas as pd

CIRC_M = np.pi * 0.18          # m per revolution
ONE_REV_PER_S = CIRC_M * 60    # 33.93 m/min
BRIDGE_S = 2                   # pauses <= 2 s are bridged in rule (b)


def bridged_time(active):
    """Seconds from first to last active interval of each run, merging gaps <= BRIDGE_S."""
    idx = np.flatnonzero(active)
    if len(idx) == 0:
        return 0
    total, start, prev = 0, idx[0], idx[0]
    for i in idx[1:]:
        if i - prev - 1 > BRIDGE_S:
            total += prev - start + 1
            start = i
        prev = i
    return total + prev - start + 1


def simulate(speeds=(10, 15, 20, 30, 40, 60, 80), bout_s=120, reps=2000, seed=2):
    rng = np.random.default_rng(seed)
    rows = []
    for v in speeds:
        period = CIRC_M / (v / 60)                      # seconds per revolution
        cur_v, cur_t, br_v, br_t = [], [], [], []
        for _ in range(reps):
            phase = rng.uniform(0, period)              # random magnet position at bout start
            times = np.arange(phase, bout_s, period)    # time of each revolution
            bins = np.bincount(np.floor(times).astype(int), minlength=bout_s)[:bout_s]
            dist = bins.sum() * CIRC_M * 60             # m (scaled to m/min below)
            n_act = (bins > 0).sum()
            n_br = bridged_time(bins > 0)
            cur_v.append(dist / n_act); cur_t.append(n_act / bout_s * 100)
            br_v.append(dist / n_br);   br_t.append(n_br / bout_s * 100)
        formula = min(v / ONE_REV_PER_S, 1) * 100       # expected share of seconds with a revolution
        rows.append(dict(true_speed=v, formula_active_pct=round(formula, 1),
                         current_speed=round(np.mean(cur_v), 1), current_active_pct=round(np.mean(cur_t), 1),
                         bridged_speed=round(np.mean(br_v), 1), bridged_active_pct=round(np.mean(br_t), 1)))
    return pd.DataFrame(rows)


def real_data(path, first_day=1, last_day=9, exclude_days=(2,)):
    d = pd.read_csv(path, parse_dates=["timestamp"]).set_index("timestamp").sort_index()
    sensors = [c for c in d.columns if c.lower().startswith("sensor")]
    revs = d[sensors].diff().clip(lower=0).fillna(0)
    revs.iloc[0] = 0
    dt = d.index.to_series().diff().dt.total_seconds().fillna(0.1)
    sample_s = dt[dt > 0].median()
    day = ((d.index - d.index[0].floor("h")) // pd.Timedelta(hours=24)) + 1   # 24-h blocks from recording start
    keep = (day >= first_day) & (day <= last_day) & (~np.isin(day, exclude_days))
    counts = {k: 0 for k in (1, 2, 3, 4)}
    n_act = n_iso = n_rev = n_rev_iso = 0
    changes = []
    for s in sensors:
        r = revs[s].values
        act = (r > 0) & (dt.values >= 0.1)
        prev, nxt = np.r_[0, r[:-1]], np.r_[r[1:], 0]
        iso = act & (r == 1) & (prev == 0) & (nxt == 0)
        for k in counts:
            counts[k] += int(((r == k) & act & keep).sum())
        n_act += int((act & keep).sum()); n_iso += int((iso & keep).sum())
        n_rev += r[keep].sum(); n_rev_iso += r[iso & keep].sum()
        for b in range(first_day, last_day + 1):
            if b in exclude_days:
                continue
            m = day == b
            dist = r[m].sum() * CIRC_M
            cur = dist / (act[m].sum() * sample_s / 60)
            br = dist / (bridged_time(act[m]) * sample_s / 60)
            changes.append((br - cur) / cur * 100)
    changes = np.array(changes)
    print(f"Active seconds analysed: {n_act}")
    print("Share of active seconds by revolutions per second:",
          {k: f"{v / n_act * 100:.1f}%" for k, v in counts.items()})
    print(f"Isolated single-revolution seconds: {n_iso / n_act * 100:.1f}% of active seconds, "
          f"{n_rev_iso / n_rev * 100:.1f}% of revolutions")
    print(f"Gap-bridged vs ΔV-LAP mean speed (per animal-day): {changes.mean():.1f}% "
          f"(range {changes.max():.1f} to {changes.min():.1f}%)")


if __name__ == "__main__":
    print("Part 1 — simulation (Supplementary 12)")
    print(simulate().to_string(index=False))
    if len(sys.argv) > 1:
        print("\nPart 2 — real recording:", sys.argv[1])
        real_data(sys.argv[1])
