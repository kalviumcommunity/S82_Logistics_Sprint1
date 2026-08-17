"""
Root Cause Investigation Orchestrator
====================================
Runs the end-to-end Root Cause Investigation & Diagnostic Analytics Engine:
1. Time Window Anomaly Isolation
2. Multi-Dimensional Segment Analysis
3. Correlation Mining & Error Log Ranking
4. External Hypothesis Validation
5. Report Synthesis & Persistence
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from time_window_isolation import build_investigation_dataset, isolate_time_window_anomaly
from segment_analysis import analyze_multidimensional_segments
from correlation_mining import analyze_correlations_and_logs
from hypothesis_validator import validate_root_cause_hypothesis
from generate_investigation_report import generate_markdown_report, save_reports


def run_full_investigation() -> dict:
    """Executes full diagnostic pipeline and returns complete payload."""
    # 1. Dataset & Time Isolation
    df = build_investigation_dataset()
    iso_res = isolate_time_window_anomaly(df)

    p_date = iso_res["anomaly_date"]
    p_hour = iso_res["problem_hour"]

    # Filter data for problem window
    p_df = df[(df['date'] == p_date) & (df['hour'] == p_hour)]

    # 2. Segment Analysis
    seg_res = analyze_multidimensional_segments(p_df)

    # 3. Correlation & Log Mining
    corr_res = analyze_correlations_and_logs(df, p_date, p_hour)

    # 4. Hypothesis Validation
    affected_channel = seg_res["primary_affected_segment"]["category"]
    val_res = validate_root_cause_hypothesis(df, p_date, p_hour, affected_channel)

    full_payload = {
        "status": "success",
        "investigation_id": "INC-20260805-LOG-01",
        "isolated_window": iso_res,
        "segment_analysis": seg_res,
        "correlation_analysis": corr_res,
        "hypothesis_validation": val_res
    }

    # 5. Save Report Files
    save_reports(full_payload)

    return full_payload


def print_cli_summary(payload: dict):
    """Prints a clean CLI investigation report summary."""
    iso = payload["isolated_window"]
    seg = payload["segment_analysis"]["primary_affected_segment"]
    corr = payload["correlation_analysis"]
    val = payload["hypothesis_validation"]

    print("=" * 80)
    print("      ROOT CAUSE INVESTIGATION & DIAGNOSTIC ANALYTICS ENGINE       ")
    print("=" * 80)
    print(f"Incident Reference : {payload['investigation_id']}")
    print(f"Isolated Window    : {iso['time_window_utc']}")
    print(f"Final Verdict      : [{val['verdict']}]")
    print("-" * 80)
    print(f"Success Rate Drop  : {iso['isolated_window_metrics']['formatted_success_rate']} (vs {iso['baseline_comparison']['before_window']['formatted_success_rate']} Baseline)")
    print(f"Estimated Revenue  : {iso['isolated_window_metrics']['formatted_revenue_loss']} Loss")
    print(f"Affected Segment   : {seg['dimension']} -> {seg['category']} ({seg['formatted_success_rate']} Success)")
    print(f"Dominant Error     : {corr['error_logs_analysis']['dominant_error']['message']}")
    print(f"Error Concentration: {corr['error_logs_analysis']['dominant_error']['formatted_concentration']}")
    print("-" * 80)
    print(f"Verdict Explanation: {val['verdict_summary']}")
    print("=" * 80)


def main():
    payload = run_full_investigation()
    print_cli_summary(payload)
    print(f"\n[+] Investigation Reports exported cleanly to: {os.path.join(SCRIPT_DIR, 'investigation_report.md')}")


if __name__ == "__main__":
    main()
