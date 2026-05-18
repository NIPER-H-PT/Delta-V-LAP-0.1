#!/usr/bin/env python3
# read_wheel_data.py  -- show Arduino ms_since_start + sensors and write CSV
import serial, csv, datetime, time, sys, re, argparse, os

def open_serial(port, baud):
    try:
        ser = serial.Serial(port, baud, timeout=1)
        time.sleep(2)
        return ser
    except Exception as e:
        print("ERROR opening serial port:", e); sys.exit(1)

def parse_numeric_tokens(line):
    nums = re.findall(r'-?\d+', line)
    return [int(n) for n in nums]

def make_outfile(outdir, animal_tag):
    os.makedirs(outdir, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    fn = f"{animal_tag}_{ts}_raw.csv"
    return os.path.join(outdir, fn)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', required=True, help='Serial port (e.g. COM13)')
    ap.add_argument('--baud', type=int, default=115200)
    ap.add_argument('--sensors', type=int, default=8)
    ap.add_argument('--outdir', default=os.path.join("..","Raw Data"))
    ap.add_argument('--animal', default='ANIMAL')
    args = ap.parse_args()

    ser = open_serial(args.port, args.baud)
    outfile = make_outfile(args.outdir, args.animal)
    headers = ['pc_ts_epoch','pc_ts_iso','ms_since_start'] + [f'sensor{i+1}' for i in range(args.sensors)]
    with open(outfile, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(headers)

    print(f"Logging from {ser.portstr} at {args.baud} baud -> {outfile}")
    print("Make sure Arduino Serial Monitor is CLOSED. Ctrl+C to stop.")
    with open(outfile, 'a', newline='') as f:
        writer = csv.writer(f)
        try:
            while True:
                raw = ser.readline()
                if not raw:
                    continue
                line = raw.decode('utf-8', errors='replace').strip()
                if not line:
                    continue
                # print raw line for debug (optional)
                # print("RAW:", line)

                nums = parse_numeric_tokens(line)
                if len(nums) < args.sensors:
                    # still try to continue if there are enough numbers overall (e.g. ms + sensors)
                    # require at least sensors count present somewhere
                    # If not, skip
                    print("Ignoring malformed (too few numbers):", line)
                    continue

                # Heuristic: if first numeric token is large (>1000) treat it as ms_since_start
                ms_since_start = None
                if nums and nums[0] > 1000:
                    ms_since_start = nums[0]

                sensors_vals = nums[-args.sensors:]  # take last N numeric tokens as sensors
                pc_ts_epoch = int(time.time() * 1000)
                pc_ts_iso = datetime.datetime.now().isoformat(timespec='milliseconds')

                # print a clear human line: ms and sensors
                print(f"ms={ms_since_start if ms_since_start is not None else 'NA'}  sensors={sensors_vals}")

                row = [pc_ts_epoch, pc_ts_iso, ms_since_start if ms_since_start is not None else ""] + sensors_vals
                writer.writerow(row)
                f.flush()
        except KeyboardInterrupt:
            print("\nStopped by user.")
        finally:
            ser.close()

if __name__ == '__main__':
    main()
