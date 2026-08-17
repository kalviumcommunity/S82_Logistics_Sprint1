"""
KPI Computation Functions Module
================================
Provides standardized, reusable Python computation functions for supply chain and customer metrics:
1. Monthly Active Users (MAU)
2. Average Revenue Per Customer (ARPC)
3. Monthly Churn Rate
4. Payment Success Rate (PSR)
5. Customer Acquisition Cost (CAC)
6. Net Revenue Retention (NRR)

All functions return a dictionary containing raw numerical values alongside formatted string representations.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Union, Optional


def _detect_column(df: pd.DataFrame, candidates: list) -> Optional[str]:
    """Helper to detect matching column names flexibly."""
    for col in candidates:
        if col in df.columns:
            return col
    return None


def calculate_mau(df: pd.DataFrame, days: int = 30) -> Dict[str, Union[int, str]]:
    """
    Monthly Active Users (MAU): Distinct customers with at least one completed 
    transaction or verified shipment event in the last N days.
    """
    if df.empty:
        return {"raw": 0, "formatted": "0"}
    
    df_copy = df.copy()
    
    date_col = _detect_column(df_copy, ['transaction_date', 'order_date', 'date', 'order_date_dateorders'])
    cust_col = _detect_column(df_copy, ['customer_id', 'user_id', 'order_customer_id', 'Customer Id'])
    status_col = _detect_column(df_copy, ['status', 'order_status', 'Order Status'])
    
    if not cust_col:
        return {"raw": 0, "formatted": "0"}

    # Filter completed status if column exists
    if status_col:
        completed_mask = df_copy[status_col].astype(str).str.lower().isin(['completed', 'complete', 'delivered', 'success'])
        df_copy = df_copy[completed_mask]

    if date_col and not pd.api.types.is_datetime64_any_dtype(df_copy[date_col]):
        df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
        
    if date_col and df_copy[date_col].notna().any():
        max_date = df_copy[date_col].max()
        cutoff = max_date - pd.Timedelta(days=days)
        filtered_df = df_copy[df_copy[date_col] >= cutoff]
    else:
        filtered_df = df_copy
        
    raw_val = int(filtered_df[cust_col].nunique())
    return {"raw": raw_val, "formatted": f"{raw_val:,}"}


def calculate_revenue_per_customer(df: pd.DataFrame) -> Dict[str, Union[float, str]]:
    """
    Average Revenue Per Customer (ARPC): Total completed order sales divided by distinct active customers.
    """
    if df.empty:
        return {"raw": 0.0, "formatted": "$0.00"}
        
    df_copy = df.copy()
    cust_col = _detect_column(df_copy, ['customer_id', 'user_id', 'order_customer_id', 'Customer Id'])
    amount_col = _detect_column(df_copy, ['amount', 'sales', 'order_item_total', 'Sales', 'total_amount'])
    status_col = _detect_column(df_copy, ['status', 'order_status', 'Order Status'])

    if not cust_col or not amount_col:
        return {"raw": 0.0, "formatted": "$0.00"}

    if status_col:
        completed_mask = df_copy[status_col].astype(str).str.lower().isin(['completed', 'complete', 'delivered', 'success'])
        completed_df = df_copy[completed_mask]
    else:
        completed_df = df_copy

    unique_customers = completed_df[cust_col].nunique()
    total_rev = completed_df[amount_col].sum()
    raw_val = float(total_rev / unique_customers) if unique_customers > 0 else 0.0
    return {"raw": round(raw_val, 2), "formatted": f"${raw_val:,.2f}"}


def calculate_churn_rate(df: pd.DataFrame, period_days: int = 30) -> Dict[str, Union[float, str]]:
    """
    Monthly Churn Rate: Percentage of active customers in Period 1 (days -60 to -30)
    with zero transaction or shipment activity in Period 2 (last 30 days).
    """
    if df.empty:
        return {"raw": 0.0, "formatted": "0.0%"}
        
    df_copy = df.copy()
    date_col = _detect_column(df_copy, ['transaction_date', 'order_date', 'date', 'order_date_dateorders'])
    cust_col = _detect_column(df_copy, ['customer_id', 'user_id', 'order_customer_id', 'Customer Id'])
    status_col = _detect_column(df_copy, ['status', 'order_status', 'Order Status'])

    if not cust_col or not date_col:
        return {"raw": 0.0, "formatted": "0.0%"}

    if status_col:
        completed_mask = df_copy[status_col].astype(str).str.lower().isin(['completed', 'complete', 'delivered', 'success'])
        df_copy = df_copy[completed_mask]

    if not pd.api.types.is_datetime64_any_dtype(df_copy[date_col]):
        df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')

    valid_dates = df_copy[date_col].dropna()
    if valid_dates.empty:
        return {"raw": 0.0, "formatted": "0.0%"}

    p2_end = valid_dates.max()
    p2_start = p2_end - pd.Timedelta(days=period_days)
    p1_end = p2_start
    p1_start = p1_end - pd.Timedelta(days=period_days)
    
    p1_active = set(df_copy[(df_copy[date_col] >= p1_start) & (df_copy[date_col] < p1_end)][cust_col].unique())
    p2_active = set(df_copy[(df_copy[date_col] >= p2_start) & (df_copy[date_col] <= p2_end)][cust_col].unique())
    
    if not p1_active:
        return {"raw": 0.0, "formatted": "0.0%"}
    
    churned_count = len(p1_active - p2_active)
    raw_val = float(churned_count / len(p1_active))
    return {"raw": round(raw_val, 4), "formatted": f"{raw_val:.1%}"}


def calculate_payment_success_rate(df: pd.DataFrame) -> Dict[str, Union[float, str]]:
    """
    Payment Success Rate (PSR): Ratio of successful completed checkout transactions over total payment attempts.
    """
    if df.empty:
        return {"raw": 0.0, "formatted": "0.0%"}

    status_col = _detect_column(df, ['status', 'order_status', 'Order Status', 'payment_status'])
    total_attempts = len(df)
    if total_attempts == 0 or not status_col:
        return {"raw": 0.0, "formatted": "0.0%"}

    successful = len(df[df[status_col].astype(str).str.lower().isin(['completed', 'complete', 'delivered', 'success', 'paid'])])
    raw_val = float(successful / total_attempts)
    return {"raw": round(raw_val, 4), "formatted": f"{raw_val:.1%}"}


def calculate_customer_acquisition_cost(spend_amount: float, new_customers_count: int) -> Dict[str, Union[float, str]]:
    """
    Customer Acquisition Cost (CAC): Total sales and marketing spend divided by net-new paying customer additions.
    """
    if new_customers_count <= 0 or spend_amount < 0:
        return {"raw": 0.0, "formatted": "$0.00"}
    raw_val = float(spend_amount / new_customers_count)
    return {"raw": round(raw_val, 2), "formatted": f"${raw_val:,.2f}"}


def calculate_net_revenue_retention(start_arr: float, expansions: float, contractions: float, churn: float) -> Dict[str, Union[float, str]]:
    """
    Net Revenue Retention (NRR): Recurring revenue retained from existing cohort customers over N days.
    """
    if start_arr <= 0:
        return {"raw": 0.0, "formatted": "0.0%"}
    end_arr = start_arr + expansions - contractions - churn
    raw_val = float(end_arr / start_arr)
    return {"raw": round(raw_val, 4), "formatted": f"{raw_val:.1%}"}
