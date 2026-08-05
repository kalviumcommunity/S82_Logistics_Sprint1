"""
KPI Computation Functions Module
================================
Provides standardized, reusable Python computation functions for 6 core enterprise metrics:
1. Monthly Active Users (MAU)
2. Average Revenue Per Customer (ARPC)
3. Monthly Churn Rate
4. Payment Success Rate (PSR)
5. Customer Acquisition Cost (CAC)
6. Net Revenue Retention (NRR)

All functions return a dictionary containing raw numeric values alongside formatted string representations.
"""

import pandas as pd
import numpy as np


def calculate_mau(df: pd.DataFrame, days: int = 30) -> dict:
    """Monthly Active Users: distinct customers active in last N days with completed status."""
    if df.empty:
        return {"raw": 0, "formatted": "0"}
    
    df_copy = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df_copy['transaction_date']):
        df_copy['transaction_date'] = pd.to_datetime(df_copy['transaction_date'], errors='coerce')
        
    cutoff = pd.Timestamp.now() - pd.Timedelta(days=days)
    filtered_df = df_copy[(df_copy['transaction_date'] >= cutoff) & (df_copy['status'] == 'completed')]
    raw_val = int(filtered_df['customer_id'].nunique())
    return {"raw": raw_val, "formatted": f"{raw_val:,}"}


def calculate_revenue_per_customer(df: pd.DataFrame) -> dict:
    """Average revenue per unique customer across completed transactions."""
    if df.empty:
        return {"raw": 0.0, "formatted": "$0.00"}
        
    completed_df = df[df['status'] == 'completed']
    unique_customers = completed_df['customer_id'].nunique()
    total_rev = completed_df['amount'].sum()
    raw_val = float(total_rev / unique_customers) if unique_customers > 0 else 0.0
    return {"raw": raw_val, "formatted": f"${raw_val:,.2f}"}


def calculate_churn_rate(df: pd.DataFrame, period_days: int = 30) -> dict:
    """Customers active in period 1 (days 2N to N ago) with no activity in period 2 (days N to now)."""
    if df.empty:
        return {"raw": 0.0, "formatted": "0.0%"}
        
    df_copy = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df_copy['transaction_date']):
        df_copy['transaction_date'] = pd.to_datetime(df_copy['transaction_date'], errors='coerce')

    p2_end = pd.Timestamp.now()
    p2_start = p2_end - pd.Timedelta(days=period_days)
    p1_end = p2_start
    p1_start = p1_end - pd.Timedelta(days=period_days)
    
    p1_active = set(df_copy[(df_copy['transaction_date'] >= p1_start) & (df_copy['transaction_date'] < p1_end) & (df_copy['status'] == 'completed')]['customer_id'].unique())
    p2_active = set(df_copy[(df_copy['transaction_date'] >= p2_start) & (df_copy['transaction_date'] <= p2_end) & (df_copy['status'] == 'completed')]['customer_id'].unique())
    
    if not p1_active:
        return {"raw": 0.0, "formatted": "0.0%"}
    
    churned_count = len(p1_active - p2_active)
    raw_val = float(churned_count / len(p1_active))
    return {"raw": raw_val, "formatted": f"{raw_val:.1%}"}


def calculate_payment_success_rate(df: pd.DataFrame) -> dict:
    """Ratio of completed transactions to total payment attempts."""
    total_attempts = len(df)
    if total_attempts == 0:
        return {"raw": 0.0, "formatted": "0.0%"}
    successful = len(df[df['status'] == 'completed'])
    raw_val = float(successful / total_attempts)
    return {"raw": raw_val, "formatted": f"{raw_val:.1%}"}


def calculate_customer_acquisition_cost(spend_amount: float, new_customers_count: int) -> dict:
    """Blended customer acquisition cost given spend and new activations."""
    if new_customers_count == 0:
        return {"raw": 0.0, "formatted": "$0.00"}
    raw_val = float(spend_amount / new_customers_count)
    return {"raw": raw_val, "formatted": f"${raw_val:,.2f}"}


def calculate_net_revenue_retention(start_arr: float, expansions: float, contractions: float, churn: float) -> dict:
    """Net Revenue Retention rate across recurring subscription cohorts."""
    if start_arr == 0:
        return {"raw": 0.0, "formatted": "0.0%"}
    end_arr = start_arr + expansions - contractions - churn
    raw_val = float(end_arr / start_arr)
    return {"raw": raw_val, "formatted": f"{raw_val:.1%}"}
