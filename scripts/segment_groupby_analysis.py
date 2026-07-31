import os
import sys
import numpy as np
import pandas as pd

# Ensure UTF-8 output handling for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

os.makedirs('output', exist_ok=True)

# Generate synthetic dataset matching problem specification & logistics domain alignment
np.random.seed(42)

# Enterprise (5% of base, 1% churn, ~70% of revenue)
n_enterprise = 500
enterprise_df = pd.DataFrame({
    'customer_id': [f"CUST-ENT-{i:04d}" for i in range(1, n_enterprise + 1)],
    'customer_type': 'Enterprise',
    'product': np.random.choice(['Freight', 'Express', 'Standard'], size=n_enterprise, p=[0.7, 0.2, 0.1]),
    'revenue': np.random.uniform(12000, 18000, size=n_enterprise),
    'churn': (np.random.uniform(0, 1, size=n_enterprise) < 0.01).astype(int),
    'support_tickets': np.random.poisson(lam=0.8, size=n_enterprise)
})

# SMB (40% of base, 12% churn, ~20% of revenue)
n_smb = 4000
smb_df = pd.DataFrame({
    'customer_id': [f"CUST-SMB-{i:04d}" for i in range(1, n_smb + 1)],
    'customer_type': 'SMB',
    'product': np.random.choice(['Freight', 'Express', 'Standard'], size=n_smb, p=[0.2, 0.5, 0.3]),
    'revenue': np.random.uniform(400, 600, size=n_smb),
    'churn': (np.random.uniform(0, 1, size=n_smb) < 0.12).astype(int),
    'support_tickets': np.random.poisson(lam=4.2, size=n_smb)
})

# Startups (55% of base, 8% churn, ~10% of revenue)
n_startup = 5500
startup_df = pd.DataFrame({
    'customer_id': [f"CUST-STU-{i:04d}" for i in range(1, n_startup + 1)],
    'customer_type': 'Startup',
    'product': np.random.choice(['Freight', 'Express', 'Standard'], size=n_startup, p=[0.1, 0.3, 0.6]),
    'revenue': np.random.uniform(150, 250, size=n_startup),
    'churn': (np.random.uniform(0, 1, size=n_startup) < 0.08).astype(int),
    'support_tickets': np.random.poisson(lam=2.5, size=n_startup)
})

df = pd.concat([enterprise_df, smb_df, startup_df], ignore_index=True)

print("=" * 80)
print("LOGISTICS SEGMENT GROUPBY & PIVOT INSIGHTS PIPELINE")
print("=" * 80)

# =========================================================================
# Task 1: Single-Level GroupBy with Multiple Aggregations
# =========================================================================
print("\n[TASK 1] Single-Level GroupBy with Multiple Aggregations")
segment_metrics = df.groupby('customer_type').agg({
    'churn': 'mean',
    'revenue': 'sum',
    'customer_id': 'count',
    'support_tickets': 'mean'
})

segment_metrics.columns = ['churn_rate', 'total_revenue', 'customer_count', 'avg_support_tickets']
print("\nSegment Metrics:")
print(segment_metrics.to_string())

# =========================================================================
# Task 2: Multi-Level GroupBy
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 2] Multi-Level GroupBy (customer_type x product)")
print("-" * 70)

product_segment = df.groupby(['customer_type', 'product']).agg({
    'revenue': 'sum',
    'customer_id': 'count'
})

product_segment.columns = ['total_revenue', 'customer_count']

# Unstack for cleaner view
product_segment_pivot = product_segment.unstack()
print("\nMulti-Level GroupBy (Unstacked View):")
print(product_segment_pivot.to_string())

# =========================================================================
# Task 3: Pivot Table
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 3] Two-Dimensional Pivot Table")
print("-" * 70)

pivot = pd.pivot_table(
    df,
    values='revenue',
    index='customer_type',
    columns='product',
    aggfunc='sum'
)

print("\nPivot Table (Revenue by customer_type and product):")
print(pivot.to_string())

# =========================================================================
# Task 4: Rank and Identify Top/Bottom Performers
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 4] Rank and Identify Top/Bottom Performers")
print("-" * 70)

# Rank segments by churn
segment_metrics['churn_rank'] = segment_metrics['churn_rate'].rank()

# Sort to see worst first
worst_first = segment_metrics.sort_values('churn_rate', ascending=False)
print("\nSegments Sorted by Churn Rate (Worst First):")
print(worst_first[['churn_rate', 'churn_rank', 'total_revenue', 'customer_count']].to_string())

# Profit/revenue ranking
segment_metrics['revenue_contribution'] = (segment_metrics['total_revenue'] / segment_metrics['total_revenue'].sum() * 100)
print("\nRevenue Contribution vs Churn Rate:")
print(segment_metrics[['revenue_contribution', 'churn_rate']].to_string())

# =========================================================================
# Task 5: Surface Actionable Segment Insights
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 5] Surface Actionable Segment Insights")
print("-" * 70)

insights = []

for segment in segment_metrics.index:
    row = segment_metrics.loc[segment]
    
    insight = {
        'segment': segment,
        'customer_count': int(row['customer_count']),
        'churn_rate': f"{row['churn_rate']:.1%}",
        'total_revenue': f"${row['total_revenue']:.0f}",
        'revenue_contribution': f"{row['revenue_contribution']:.1f}%",
        'action': ''
    }
    
    # Action based on metrics
    if row['churn_rate'] > 0.10:
        insight['action'] = 'HIGH PRIORITY: Churn above 10%. Investigate pain points.'
    elif row['churn_rate'] < 0.02:
        insight['action'] = 'Healthy. Maintain current service level.'
    else:
        insight['action'] = 'Monitor. No immediate action needed.'
    
    insights.append(insight)

insights_df = pd.DataFrame(insights)
print("\nSegment Actionable Insights Summary:")
print(insights_df.to_string(index=False))

out_path = 'output/segment_insights.csv'
insights_df.to_csv(out_path, index=False)
print(f"\n✓ Saved segment insights report to {out_path}")
