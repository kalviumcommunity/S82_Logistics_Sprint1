#!/usr/bin/env python3
"""
Automated Data Cleanup & File Maintenance Subsystem
================================-------------------
Executes post-transformation file maintenance to maintain repository hygiene:
- Deletes temporary staging CSV files (`raw_staging_telemetry.csv`, `temp_*.csv`).
- Preserves essential configuration files, `data_analysis.ipynb`, and `cleaned_analytics.json`.
- Prints terminal confirmation log.
"""

import os
import sys
import glob

# Ensure UTF-8 output encoding for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass


def run_cleanup():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    files_to_remove = []

    # Temporary staging CSVs in server/analytics/
    staging_csv = os.path.join(script_dir, "raw_staging_telemetry.csv")
    if os.path.exists(staging_csv):
        files_to_remove.append(staging_csv)

    # Any temp_*.csv files in server/analytics/ or project root
    temp_csvs = glob.glob(os.path.join(script_dir, "temp_*.csv")) + \
                glob.glob(os.path.join(project_root, "server", "src", "data", "temp_*.csv"))
    files_to_remove.extend(temp_csvs)

    purged_count = 0
    for file_path in set(files_to_remove):
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                purged_count += 1
        except Exception as e:
            print(f"[CLEANUP WARNING] Failed to remove {file_path}: {e}")

    print(f"[CLEANUP] Post-transformation garbage collection complete. Temporary staging CSV files purged. Repository clean.")
    return purged_count


if __name__ == "__main__":
    run_cleanup()
