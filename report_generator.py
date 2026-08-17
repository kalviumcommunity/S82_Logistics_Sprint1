import pandas as pd
from datetime import datetime


def generate_report(df, report_date=None):
    """Generate structured text report from analysis output."""
    if report_date is None:
        report_date = datetime.now().date()

    # Dynamic column identification with standard fallbacks
    rev_col = "revenue" if "revenue" in df.columns else next((c for c in df.select_dtypes(include="number").columns), None)
    cust_col = "customer_id" if "customer_id" in df.columns else next((c for c in df.columns if "cust" in c.lower() or "id" in c.lower() or "user" in c.lower()), None)
    seg_col = "segment" if "segment" in df.columns else next((c for c in df.select_dtypes(include=["object", "category"]).columns if c != cust_col), None)

    revenue = df[rev_col].sum() if rev_col and rev_col in df.columns else 0.0
    customers = df[cust_col].nunique() if cust_col and cust_col in df.columns else len(df)
    avg_order = df[rev_col].mean() if rev_col and rev_col in df.columns and len(df) > 0 else 0.0

    lines = []
    lines.append("WEEKLY ANALYTICS REPORT")
    lines.append("Date: " + str(report_date))
    lines.append("")

    # Section 1: KPI Summary
    lines.append("== KPI SUMMARY ==")
    lines.append("Total Revenue: $" + f"{revenue:,.0f}")
    lines.append("Active Customers: " + f"{customers:,}")
    lines.append("Average Order: $" + f"{avg_order:,.0f}")
    lines.append("")

    # Section 2: Key Finding
    lines.append("== KEY FINDING ==")
    if seg_col and rev_col and seg_col in df.columns and rev_col in df.columns and len(df) > 0:
        top_seg = df.groupby(seg_col)[rev_col].sum().idxmax()
        lines.append("Top segment: " + str(top_seg))
    else:
        lines.append("Top segment: All Segments")
    lines.append("")

    # Section 3: Recommended Action
    lines.append("== RECOMMENDED ACTION ==")
    lines.append("Allocate resources to high-growth segments.")

    return "\n".join(lines)
