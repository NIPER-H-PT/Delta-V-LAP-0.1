# LocoMetrics: High-Resolution Rodent Kinematic Analysis

**LocoMetrics** is an open-source computational framework designed to process and analyze instantaneous temporal telemetry from voluntary rodent running wheels. It translates raw, event-driven sensor data into standardized kinematic and circadian variables suitable for preclinical behavioral research.

## Features
* **Instantaneous Telemetry Processing:** Processes discrete temporal events rather than cumulative approximations.
* **Hardware Bounce Filtration ($\tau_{noise}$):** Implements a strict 0.1-second filter to eliminate mechanical double-counts without diluting true high-speed locomotion.
* **Bout Fragmentation:** Utilizes a customizable Inter-Tick Interval (ITI) threshold (default: 10s) to biologically segment active running bouts from resting periods.
* **Continuous Resampling:** Transforms discrete event data into 1-second continuous timelines to accurately calculate peak speeds (m/min) via rolling averages without sparse-data dilution.
* **Circadian Mapping:** Automatically segments locomotion into user-defined light/dark photoperiods.

## Deployment Architecture
To ensure **data sovereignty** (institutional data privacy) and **maximum computational efficiency**, LocoMetrics is designed primarily for local, on-premises execution. Processing high-density temporal kinematics is computationally intensive; utilizing native local hardware allows multi-hour datasets to process in milliseconds.

### Local Installation (Recommended)
1. **Clone the repository:**
   `git clone https://github.com/YourUsername/YourRepoName.git`
2. **Navigate into the directory:**
   `cd YourRepoName`
3. **Install the required dependencies:**
   `pip install -r requirements.txt`
4. **Start the local server:**
   `uvicorn main:app --host 127.0.0.1 --port 8000`

The API will now be live on your local machine, ready to process telemetry data instantly and privately.

## Data Formatting
The software expects standard comma-separated values (`.csv`) output directly from the hardware micro-controller. 
* **Required Column 1:** `timestamp` (ISO 8601 format preferred, e.g., `YYYY-MM-DDTHH:MM:SS.ssssss`)
* **Required Column 2+:** Sensor data columns containing integer tick counts.

## License
Distributed under the MIT License. See `LICENSE` for more information.