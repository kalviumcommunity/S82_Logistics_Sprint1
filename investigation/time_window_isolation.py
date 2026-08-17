"""
Time Window Isolation Engine
============================
Performs automated time-series anomaly detection across transaction & telemetry logs:
1. Daily Aggregation & Anomaly Identification:
   - Computes daily success rates across historical data.
   - Detects anomaly dates where daily success rate drops below statistical threshold (Mean - 1.5 * StdDev).
2. Hourly Zoom & Window Isolation:
   - Isolates the anomaly date and computes hourly success rate breakdowns.
   - Identifies exact worst-performing hour window (problem_hour).
3. Baseline Metric Comparison:
   - Computes before-and-after baseline metrics (success rate %, volume, revenue) for preceding and following hour windows.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple


def build_investigation_dataset() -> pd.DataFrame:
    """
    Generates realistic historical supply chain transaction data cleanly in-memory.
    Returns DataFrame with columns: ['transaction_id', 'timestamp', 'date', 'hour', 'customer_id', 'segment', 'payment_method', 'region', 'device_type', 'status', 'amount', 'error_message'].
    """
    np.random.seed(42)
    
    n_days = 14
    base_date = pd.Timestamp('2026-07-26 00:00:00')

    segments = ['Enterprise', 'SMB', 'Startup']
    seg_weights = [0.50, 0.35, 0.15]

    payment_methods = ['Credit Card (Stripe)', 'Debit Card', 'Bank Wire', 'Crypto']
    pm_weights = [0.65, 0.20, 0.10, 0.05]

    regions = ['North America - East', 'Europe - Central', 'Asia Pacific - South', 'LATAM']
    reg_weights = [0.45, 0.30, 0.15, 0.10]

    devices = ['Web API', 'Mobile App', 'Desktop Gateway', 'EDI Feed']
    dev_weights = [0.55, 0.25, 0.12, 0.08]

    stripe_errors = [
        "ERR_GATEWAY_TIMEOUT_504: Stripe Payment Gateway Connection Reset",
        "ERR_STRIPE_AUTH_502: Upstream Payment Service Unavailable",
        "ERR_SOCKET_HANGUP: TLS Handshake Timeout to Stripe API Endpoint",
    ]
    other_errors = [
        "ERR_INSUFFICIENT_FUNDS: Cardholder limit exceeded",
        "ERR_INVALID_CVV: Security check failed",
        "ERR_USER_ABORT: Customer cancelled checkout",
    ]

    records = []
    tx_counter = 100000

    for day_idx in range(n_days):
        curr_day = base_date + pd.Timedelta(days=day_idx)
        date_str = curr_day.strftime('%Y-%m-%d')
        is_anomaly_day = (day_idx == 10) # 2026-08-05

        for hour in range(24):
            hourly_volume = 50 if 8 <= hour <= 20 else 20
            is_anomaly_hour = (is_anomaly_day and hour == 14)

            for _ in range(hourly_volume):
                tx_counter += 1
                minutes = np.random.randint(0, 60)
                tx_time = curr_day + pd.Timedelta(hours=hour, minutes=minutes)

                seg = np.random.choice(segments, p=seg_weights)
                pm = np.random.choice(payment_methods, p=pm_weights)
                reg = np.random.choice(regions, p=reg_weights)
                dev = np.random.choice(devices, p=dev_weights)
                amt = round(float(np.random.uniform(45.0, 320.0)), 2)

                if is_anomaly_hour:
                    if pm == 'Credit Card (Stripe)':
                        # Outage for credit card
                        is_success = (np.random.random() < 0.15)
                        status = 'completed' if is_success else 'failed'
                        err_msg = np.random.choice(stripe_errors, p=[0.85, 0.10, 0.05]) if not is_success else None
                    else:
                        # Non-credit card channels operate normally
                        is_success = (np.random.random() < 0.99)
                        status = 'completed' if is_success else 'failed'
                        err_msg = np.random.choice(other_errors) if not is_success else None
                else:
                    # Baseline operational success: 98.5%
                    is_success = (np.random.random() < 0.985)
                    status = 'completed' if is_success else 'failed'
                    err_msg = np.random.choice(other_errors) if not is_success else None

                records.append({
                    'transaction_id': f"TXN_{tx_counter}",
                    'timestamp': tx_time,
                    'date': date_str,
                    'hour': hour,
                    'customer_id': np.random.randint(1000, 9000),
                    'segment': seg,
                    'payment_method': pm,
                    'region': reg,
                    'device_type': dev,
                    'status': status,
                    'is_completed': 1 if status == 'completed' else 0,
                    'is_failed': 1 if status == 'failed' else 0,
                    'amount': amt,
                    'completed_amount': amt if status == 'completed' else 0.0,
                    'failed_amount': amt if status == 'failed' else 0.0,
                    'error_message': err_msg
                })

    return pd.DataFrame(records)


def isolate_time_window_anomaly(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes historical DataFrame using fast native pandas aggregations.
    """
    daily_stats = df.groupby('date').agg(
        total_tx=('transaction_id', 'count'),
        completed_tx=('is_completed', 'sum'),
        failed_tx=('is_failed', 'sum'),
        total_revenue=('completed_amount', 'sum')
    ).reset_index()

    daily_stats['success_rate'] = daily_stats['completed_tx'] / daily_stats['total_tx']
    
    mean_sr = daily_stats['success_rate'].mean()
    std_sr = daily_stats['success_rate'].std()
    threshold_sr = mean_sr - (1.5 * std_sr)

    anomaly_dates_df = daily_stats[daily_stats['success_rate'] < threshold_sr]
    
    if anomaly_dates_df.empty:
        anomaly_date = daily_stats.loc[daily_stats['success_rate'].idxmin()]['date']
    else:
        anomaly_date = anomaly_dates_df.sort_values('success_rate').iloc[0]['date']

    anomaly_day_df = df[df['date'] == anomaly_date]

    hourly_stats = anomaly_day_df.groupby('hour').agg(
        total_tx=('transaction_id', 'count'),
        completed_tx=('is_completed', 'sum'),
        failed_tx=('is_failed', 'sum'),
        revenue=('completed_amount', 'sum')
    ).reset_index()

    hourly_stats['success_rate'] = hourly_stats['completed_tx'] / hourly_stats['total_tx']

    problem_hour_row = hourly_stats.loc[hourly_stats['success_rate'].idxmin()]
    problem_hour = int(problem_hour_row['hour'])

    before_hours = list(range(max(0, problem_hour - 3), problem_hour))
    after_hours = list(range(problem_hour + 1, min(24, problem_hour + 4)))

    before_df = anomaly_day_df[anomaly_day_df['hour'].isin(before_hours)]
    problem_df = anomaly_day_df[anomaly_day_df['hour'] == problem_hour]
    after_df = anomaly_day_df[anomaly_day_df['hour'].isin(after_hours)]

    before_sr = before_df['is_completed'].mean() if not before_df.empty else 0.985
    problem_sr = float(problem_hour_row['success_rate'])
    after_sr = after_df['is_completed'].mean() if not after_df.empty else 0.985

    before_vol = len(before_df)
    problem_vol = int(problem_hour_row['total_tx'])
    after_vol = len(after_df)

    before_rev = float(before_df['completed_amount'].sum())
    problem_rev = float(problem_hour_row['revenue'])
    after_rev = float(after_df['completed_amount'].sum())

    expected_rev = (before_rev / max(1, len(before_hours)))
    revenue_impact = max(0.0, expected_rev - problem_rev)

    return {
        "anomaly_date": anomaly_date,
        "problem_hour": problem_hour,
        "time_window_utc": f"{anomaly_date} {problem_hour:02d}:00:00 - {problem_hour:02d}:59:59 UTC",
        "statistical_thresholds": {
            "mean_success_rate": round(float(mean_sr), 4),
            "std_dev_success_rate": round(float(std_sr), 4),
            "anomaly_threshold_rate": round(float(threshold_sr), 4)
        },
        "isolated_window_metrics": {
            "total_transactions": problem_vol,
            "failed_transactions": int(problem_hour_row['failed_tx']),
            "completed_transactions": int(problem_hour_row['completed_tx']),
            "success_rate": round(problem_sr, 4),
            "formatted_success_rate": f"{problem_sr:.1%}",
            "revenue": round(problem_rev, 2),
            "formatted_revenue": f"${problem_rev:,.2f}",
            "estimated_revenue_loss": round(revenue_impact, 2),
            "formatted_revenue_loss": f"${revenue_impact:,.2f}"
        },
        "baseline_comparison": {
            "before_window": {
                "hours": f"{before_hours[0]:02d}:00 - {before_hours[-1]:02d}:59 UTC" if before_hours else "N/A",
                "success_rate": round(float(before_sr), 4),
                "formatted_success_rate": f"{before_sr:.1%}",
                "total_volume": before_vol,
                "revenue": round(before_rev, 2),
                "formatted_revenue": f"${before_rev:,.2f}"
            },
            "problem_window": {
                "hours": f"{problem_hour:02d}:00 - {problem_hour:02d}:59 UTC",
                "success_rate": round(problem_sr, 4),
                "formatted_success_rate": f"{problem_sr:.1%}",
                "total_volume": problem_vol,
                "revenue": round(problem_rev, 2),
                "formatted_revenue": f"${problem_rev:,.2f}"
            },
            "after_window": {
                "hours": f"{after_hours[0]:02d}:00 - {after_hours[-1]:02d}:59 UTC" if after_hours else "N/A",
                "success_rate": round(float(after_sr), 4),
                "formatted_success_rate": f"{after_sr:.1%}",
                "total_volume": after_vol,
                "revenue": round(after_rev, 2),
                "formatted_revenue": f"${after_rev:,.2f}"
            }
        },
        "hourly_breakdown": [
            {
                "hour": int(row['hour']),
                "time_label": f"{int(row['hour']):02d}:00",
                "total_tx": int(row['total_tx']),
                "completed_tx": int(row['completed_tx']),
                "failed_tx": int(row['failed_tx']),
                "success_rate": round(float(row['success_rate']), 4),
                "formatted_success_rate": f"{float(row['success_rate']):.1%}"
            }
            for _, row in hourly_stats.iterrows()
        ]
    }


if __name__ == "__main__":
    df = build_investigation_dataset()
    res = isolate_time_window_anomaly(df)
    print("Isolated Window:", res["time_window_utc"])
    print("Success Rate:", res["isolated_window_metrics"]["formatted_success_rate"])
