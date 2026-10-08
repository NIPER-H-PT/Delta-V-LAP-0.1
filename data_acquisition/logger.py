#!/usr/bin/env python3
"""
logger.py  —  ΔV-LAP in vivo serial logger
-------------------------------------------------------------------------------
NOTE: This is a reconstruction. The original logger used for the published
recording was not archived. This script reproduces the same output format as
the published data file:

    timestamp,sensor1,sensor2,sensor3,sensor4,sensor5,sensor6,sensor7,sensor8
    2026-04-06T21:16:17.382426,1,0,0,0,0,0,0,0

Input: the line format sent by data_acquisition/mice_logger.ino — eight
cumulative revolution counts separated by commas, once per second.
Each received line is written with the PC-clock time of reception.

Usage
    1. Upload mice_logger.ino to the Arduino UNO R3 and close the Arduino
       Serial Monitor.
    2. Set PORT below (e.g. "COM3" on Windows, "/dev/ttyACM0" on Linux) or use
       the --port option.
    3. Run:  python logger.py            (stop with Ctrl+C)
       Optional: python logger.py --port COM5 --out my_recording.csv
-------------------------------------------------------------------------------
"""
import argparse
import csv
import datetime
import os
import sys
import time

import serial  # pip install pyserial

PORT = "COM3"        # <- edit this to your Arduino's serial port
BAUD = 115200        # must match Serial.begin() in mice_logger.ino
N_SENSORS = 8
HEADER = ["timestamp"] + [f"sensor{i}" for i in range(1, N_SENSORS + 1)]


def parse_line(line):
    """Return a list of N_SENSORS ints, or None if the line is malformed."""
    parts = [p.strip() for p in line.strip().split(",")]
    if len(parts) != N_SENSORS:
        return None
    try:
        return [int(p) for p in parts]
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser(description="ΔV-LAP in vivo serial logger")
    ap.add_argument("--port", default=PORT, help=f"serial port (default {PORT})")
    ap.add_argument("--baud", type=int, default=BAUD)
    ap.add_argument("--out", default=None,
                    help="output CSV (default: wheel_YYYYMMDD_HHMMSS.csv)")
    args = ap.parse_args()

    out = args.out or datetime.datetime.now().strftime("wheel_%Y%m%d_%H%M%S.csv")
    try:
        ser = serial.serial_for_url(args.port, args.baud, timeout=2)
    except Exception as e:
        sys.exit(f"Could not open serial port {args.port}: {e}")
    time.sleep(2)            # Arduino resets when the port opens
    ser.reset_input_buffer()  # discard partial start-up lines

    new_file = not os.path.exists(out) or os.path.getsize(out) == 0
    print(f"Logging {args.port} -> {out}   (Ctrl+C to stop)")
    n_rows = n_bad = 0
    with open(out, "a", newline="") as fh:
        w = csv.writer(fh)
        if new_file:
            w.writerow(HEADER)
        try:
            while True:
                raw = ser.readline()
                if not raw:
                    continue
                counts = parse_line(raw.decode("utf-8", errors="replace"))
                if counts is None:
                    n_bad += 1
                    continue
                w.writerow([datetime.datetime.now().isoformat()] + counts)
                fh.flush()
                n_rows += 1
                if n_rows % 60 == 0:
                    print(f"{n_rows} rows written (last: {counts})")
        except KeyboardInterrupt:
            print(f"\nStopped. {n_rows} rows written, {n_bad} malformed lines skipped.")
        finally:
            ser.close()


if __name__ == "__main__":
    main()
