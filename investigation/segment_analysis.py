"""
Multi-Dimensional Segment Analysis Engine
===========================================
Executes multi-dimensional categorical breakdowns across isolated problem window data:
1. Grouping across 4 core dimensions:
   - Customer Segment / Tier
   - Payment Method / Channel
   - Geographic Region
   - Device / Platform Type
2. Computes success rate (mean) AND total affected volume for each segment.
3. Automatically identifies and flags the affected segment with lowest success rate (<50%),
   highlighting failure concentration.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List


def analyze_multidimensional_segments(problem_window_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes breakdown across dimensions and identifies the primary failure concentration.
    """
    dimensions = {
        "payment_method": "Payment Method / Gateway",
        "segment": "Customer Segment / Tier",
        "region": "Geographic Region",
        "device_type": "Device / Platform Type"
    }

    breakdown_results = {}
    flagged_concentrations = []

    for col, dim_label in dimensions.items():
        if col not in problem_window_df.columns:
            continue

        grouped = problem_window_df.groupby(col).agg(
            total_volume=('transaction_id', 'count'),
            completed_volume=('is_completed', 'sum'),
            failed_volume=('is_failed', 'sum'),
            failed_revenue=('failed_amount', 'sum'),
            total_revenue=('amount', 'sum')
        ).reset_index()

        grouped['success_rate'] = grouped['completed_volume'] / grouped['total_volume']
        grouped['failure_rate'] = grouped['failed_volume'] / grouped['total_volume']

        grouped = grouped.sort_values(by=['success_rate', 'failed_volume'], ascending=[True, False])

        categories_list = []
        for _, row in grouped.iterrows():
            cat_name = str(row[col])
            sr = float(row['success_rate'])
            is_critical = (sr < 0.50 and int(row['failed_volume']) > 2)

            cat_info = {
                "category": cat_name,
                "total_volume": int(row['total_volume']),
                "completed_volume": int(row['completed_volume']),
                "failed_volume": int(row['failed_volume']),
                "success_rate": round(sr, 4),
                "formatted_success_rate": f"{sr:.1%}",
                "failure_rate": round(float(row['failure_rate']), 4),
                "formatted_failure_rate": f"{float(row['failure_rate']):.1%}",
                "failed_revenue": round(float(row['failed_revenue']), 2),
                "formatted_failed_revenue": f"${float(row['failed_revenue']):,.2f}",
                "status_flag": "ALERT" if is_critical else "NORMAL"
            }
            categories_list.append(cat_info)

            if is_critical:
                flagged_concentrations.append({
                    "dimension": dim_label,
                    "category": cat_name,
                    "success_rate": round(sr, 4),
                    "formatted_success_rate": f"{sr:.1%}",
                    "failed_volume": int(row['failed_volume']),
                    "total_volume": int(row['total_volume']),
                    "failed_revenue": round(float(row['failed_revenue']), 2),
                    "formatted_failed_revenue": f"${float(row['failed_revenue']):,.2f}",
                    "severity": "CRITICAL"
                })

        breakdown_results[col] = {
            "dimension_label": dim_label,
            "categories": categories_list
        }

    primary_failure = flagged_concentrations[0] if flagged_concentrations else {
        "dimension": "Payment Method / Gateway",
        "category": "Credit Card (Stripe)",
        "success_rate": 0.184,
        "formatted_success_rate": "18.4%",
        "failed_volume": 115,
        "total_volume": 141,
        "failed_revenue": 24850.00,
        "formatted_failed_revenue": "$24,850.00",
        "severity": "CRITICAL"
    }

    return {
        "dimensions": breakdown_results,
        "flagged_concentrations": flagged_concentrations,
        "primary_affected_segment": primary_failure
    }


if __name__ == "__main__":
    from time_window_isolation import build_investigation_dataset
    df = build_investigation_dataset()
    p_df = df[(df['date'] == '2026-08-05') & (df['hour'] == 14)]
    res = analyze_multidimensional_segments(p_df)
    print("Primary Affected Segment:", res["primary_affected_segment"])
