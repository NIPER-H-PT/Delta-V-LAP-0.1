# motor_logger.py  (motor logger with reconstructed timestamps from Arduino ms_since_start)
# Usage: py motor_logger.py --port COM13 --animal TEST --rotate-minutes 60

import serial, csv, datetime, time, argparse, sys, os

parser = argparse.ArgumentParser()
parser.add_argument('--port','-p', required=True, help="Serial port, e.g. COM13")
parser.add_argument('--baud','-b', type=int, default=115200)
parser.add_argument('--animal', default='TEST', help="Used for output filename")
parser.add_argument('--rotate-minutes', type=int, default=60)
args = parser.parse_args()

def open_serial(port, baud):
    try:
        s = serial.Serial(port, baud, timeout=1)
        time.sleep(2)  # allow Arduino auto-reset
        return s
    except Exception as e:
        print("ERROR opening serial port:", e)
        sys.exit(1)

def rotate_name(animal):
    ts = datetime.datetime.now().astimezone().strftime("%Y%m%d_%H%M%S")
    return os.path.join("..", "Raw Data", f"{animal}_{ts}_raw.csv")

ser = open_serial(args.port, args.baud)
out_file = rotate_name(args.animal)
os.makedirs(os.path.dirname(out_file), exist_ok=True)

# write header if new
if not os.path.exists(out_file) or os.path.getsize(out_file) == 0:
    with open(out_file, 'w', newline='') as fh:
        csv.writer(fh).writerow(['pc_ts','ms_since_start','encoder_pulses','s1','s2','s3','s4','s5','s6','s7','s8'])

print("Logging to", out_file)
f = open(out_file, 'a', newline='')
w = csv.writer(f)

# anchor variables to reconstruct timestamps from ms_since_start
anchor_t0 = None   # datetime (timezone-aware) corresponding to anchor_m0
anchor_m0 = None   # ms_since_start integer at anchor

try:
    while True:
        raw = ser.readline()
        if not raw:
            continue
        try:
            line = raw.decode('utf-8', errors='replace').strip()
        except Exception:
            continue
        # ignore empty or 'ready' startup noise
        if not line or line.lower() == 'ready':
            continue
        parts = [p.strip() for p in line.split(',') if p.strip()!='']
        # expecting at least 10 items: ms_since_start, encoder, s1..s8
        if len(parts) < 10:
            # sometimes partial fragments appear; print short debug and skip
            print("Malformed skip:", line)
            continue

        # parse Arduino ms_since_start safely
        try:
            ms = int(float(parts[0]))  # sometimes Arduino prints floats or trailing chars; cast via float->int
        except Exception:
            print("Bad ms value, skipping:", parts[0])
            continue

        # set anchor on first valid line
        if anchor_t0 is None:
            anchor_t0 = datetime.datetime.now().astimezone()
            anchor_m0 = ms
            # small debug print
            print(f"Anchor set: anchor_t0={anchor_t0.isoformat(timespec='milliseconds')}, anchor_m0={anchor_m0}")

        # reconstruct pc timestamp aligned to Arduino ms
        try:
            delta_ms = ms - anchor_m0
            pc_ts_dt = anchor_t0 + datetime.timedelta(milliseconds=delta_ms)
            pc_ts = pc_ts_dt.isoformat(timespec='milliseconds')
        except Exception as e:
            # fallback to local now if something odd
            pc_ts = datetime.datetime.now().astimezone().isoformat(timespec='milliseconds')
            print("Timestamp reconstruct failed, using now:", e)

        # write row: pc_ts reconstructed + raw parts (limit to first 10 parts)
        try:
            w.writerow([pc_ts] + parts[:10])
            f.flush()
        except Exception as e:
            print("Write error:", e)
            continue

        # print a concise line to console for monitoring (encoder + s1)
        try:
            enc = parts[1]
            s2 = parts[2] if len(parts) > 2 else ''
            print(pc_ts, "ms:", ms, "enc:", enc, "s2:", s2)
        except Exception:
            print(pc_ts, "ms:", ms)
except KeyboardInterrupt:
    print("\nStopped by user")
finally:
    f.close()
    ser.close()

