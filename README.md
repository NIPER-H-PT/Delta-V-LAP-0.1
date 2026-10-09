# ΔV-LAP v0.1 – DeltaV Locomotor Analysis Platform

Open-source hardware and software for automated monitoring and analysis of
voluntary wheel running in mice (Arduino UNO R3 + Hall-effect sensors + no-code
analysis platform).

## Repository contents
- data_acquisition/
  - mice_logger.ino      In vivo firmware: 8 channels (D8–D13, A0, A1), polling,
                         3-ms debounce, cumulative counts sent once per second
  - logger.py            In vivo serial logger -> CSV (timestamp, sensor1..sensor8);
                         reconstruction of the unarchived original, same output format
  - bench_logger.ino     Bench-test firmware: pin-change interrupts, 4-ms lockout,
                         ms since start + 8 counts every 100 ms
  - read_wheel_data.py   Bench-test serial logger (python read_wheel_data.py --port COM3)
- backend/               FastAPI back-end (main.py, core/kinematics.py, core/llm.py)
- frontend/              React + Vite user interface
- analysis/one_hz_resolution_check.py   Reproduces - analysis/one_hz_resolution_check.py   Reproduces Supplementary 8 and the 1-Hz checks and the 1-Hz checks

## Requirements
Python 3.10 or later, Node.js 18 or later, Arduino IDE 2.x

## Installation
    git clone https://github.com/NIPER-H-PT/Delta-V-LAP-0.1 DeltaV-LAP
    cd DeltaV-LAP/backend
    python -m venv venv
    venv\Scripts\activate            (Windows)   |   source venv/bin/activate   (macOS/Linux)
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8080

In a second terminal:
    cd DeltaV-LAP/frontend
    npm install
    npm run dev                      then open the address shown (usually http://localhost:5173)

## Recording
1. Upload data_acquisition/mice_logger.ino to the Arduino UNO R3 (Arduino IDE).
2. Set the serial port in logger.py and run:  python logger.py
3. Stop with Ctrl + C; upload the CSV file to ΔV-LAP.

## Input format
CSV with a "timestamp" column and one cumulative revolution-count column per sensor.

## Measures (see manuscript, ## Measures (see manuscript, Table 10))
Revolutions (primary), distance (revolutions x 0.565 m, nominal rim distance),
active duration (1-s intervals with >= 1 revolution), bouts (separated by > 10 s),
mean speed (distance / active duration), peak speed (highest 10-s mean).
Limits: direction is not recorded; at 1-Hz reporting, speed and active duration
are biased below ~34 m/min; tested only with 18-cm saucer wheels.

## Optional AI summary
Create backend/.env containing:  GEMINI_API_KEY=your_api_key_here
When used, daily summaries (no raw counts), the file name and subject labels are
sent to the Google Gemini API. All other features run locally without a key.

## Licence
MIT (see LICENSE).
