import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Ensure UTF-8 output handling for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

os.makedirs('output', exist_ok=True)

# Set random seed for reproducibility
np.random.seed(42)

# =========================================================================
# Dataset Generation: Logistics Customer Segments & Operational Telemetry
# =========================================================================
# Enterprise (5% of base, 1% churn, $150k average LTV, ~0.8 support tickets, ~730 days retention)
n_enterprise = 500
enterprise_df = pd.DataFrame({
    'customer_id': [f"CUST-ENT-{i:04d}" for i in range(1, n_enterprise + 1)],
    'customer_type': 'Enterprise',
    'product_tier': np.random.choice(['Freight Express', 'Priority Direct', 'Standard Ground'], size=n_enterprise, p=[0.7, 0.2, 0.1]),
    'region': np.random.choice(['North America', 'Europe', 'Asia Pacific'], size=n_enterprise, p=[0.5, 0.3, 0.2]),
    'lifetime_value': np.random.normal(loc=150000, scale=15000, size=n_enterprise).clip(100000, 200000),
    'churn': (np.random.uniform(0, 1, size=n_enterprise) < 0.01).astype(int),
    'support_tickets': np.random.poisson(lam=0.8, size=n_enterprise),
    'retention_days': np.random.normal(loc=730, scale=60, size=n_enterprise).clip(365, 1095)
})

# SMB (40% of base, 12% churn, $12k average LTV, ~4.2 support tickets, ~180 days retention)
n_smb = 4000
smb_df = pd.DataFrame({
    'customer_id': [f"CUST-SMB-{i:04d}" for i in range(1, n_smb + 1)],
    'customer_type': 'SMB',
    'product_tier': np.random.choice(['Freight Express', 'Priority Direct', 'Standard Ground'], size=n_smb, p=[0.2, 0.5, 0.3]),
    'region': np.random.choice(['North America', 'Europe', 'Asia Pacific'], size=n_smb, p=[0.4, 0.4, 0.2]),
    'lifetime_value': np.random.normal(loc=12000, scale=2000, size=n_smb).clip(5000, 25000),
    'churn': (np.random.uniform(0, 1, size=n_smb) < 0.12).astype(int),
    'support_tickets': np.random.poisson(lam=4.2, size=n_smb),
    'retention_days': np.random.normal(loc=180, scale=30, size=n_smb).clip(30, 365)
})

# Startup (55% of base, 8% churn, $2k average LTV, ~2.5 support tickets, ~345 days retention)
n_startup = 5500
startup_df = pd.DataFrame({
    'customer_id': [f"CUST-STU-{i:04d}" for i in range(1, n_startup + 1)],
    'customer_type': 'Startup',
    'product_tier': np.random.choice(['Freight Express', 'Priority Direct', 'Standard Ground'], size=n_startup, p=[0.1, 0.3, 0.6]),
    'region': np.random.choice(['North America', 'Europe', 'Asia Pacific'], size=n_startup, p=[0.6, 0.2, 0.2]),
    'lifetime_value': np.random.normal(loc=2000, scale=400, size=n_startup).clip(500, 5000),
    'churn': (np.random.uniform(0, 1, size=n_startup) < 0.08).astype(int),
    'support_tickets': np.random.poisson(lam=2.5, size=n_startup),
    'retention_days': np.random.normal(loc=345, scale=45, size=n_startup).clip(60, 600)
})

df = pd.concat([enterprise_df, smb_df, startup_df], ignore_index=True)

print("=" * 80)
print("LOGISTICS CUSTOMER SEGMENTATION & OPERATIONAL METRICS ANALYSIS")
print("Aligned with Problem Statement: Predicting Cascading Delays & Churn Risk Across Routes")
print("=" * 80)

# =========================================================================
# Task 1: Define Segments and Compute Metrics
# =========================================================================
print("\n[TASK 1] Define Segments and Compute Metrics")
print("-" * 70)

segment_metrics = df.groupby('customer_type').agg({
    'lifetime_value': 'mean',
    'churn': 'mean',
    'support_tickets': 'mean',
    'retention_days': 'mean',
    'customer_id': 'count'
})

segment_metrics.columns = ['avg_ltv', 'churn_rate', 'avg_tickets', 'avg_retention', 'count']

print("\nComputed Segment Metrics:")
print(segment_metrics.to_string())

print("\nSegment Size & Base Percentage Breakdown:")
total_customers = len(df)
for seg in segment_metrics.index:
    count = segment_metrics.loc[seg, 'count']
    pct = (count / total_customers) * 100
    print(f" - {seg}: {count:,} customers ({pct:.1f}% of base)")

# =========================================================================
# Task 2: Summary Statistics Table
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 2] Summary Statistics Table (Rankings & Readable Labels)")
print("-" * 70)

segment_summary = segment_metrics.copy()
segment_summary['ltv_rank'] = segment_summary['avg_ltv'].rank(ascending=False)
segment_summary['churn_rank'] = segment_summary['churn_rate'].rank(ascending=True)

print("\nSegment Summary Table (Rankings):")
print(segment_summary[['avg_ltv', 'ltv_rank', 'churn_rate', 'churn_rank']])

# Formatted summary display table
formatted_summary = pd.DataFrame({
    'Segment Size': segment_summary['count'].map('{:,}'.format),
    'Avg LTV ($)': segment_summary['avg_ltv'].map('${:,.0f}'.format),
    'LTV Rank': segment_summary['ltv_rank'].astype(int),
    'Churn Rate (%)': segment_summary['churn_rate'].map('{:.1%}'.format),
    'Churn Rank': segment_summary['churn_rank'].astype(int),
    'Avg Tickets': segment_summary['avg_tickets'].map('{:.1f}'.format),
    'Avg Retention': segment_summary['avg_retention'].map('{:.0f} days'.format)
}, index=segment_summary.index)

print("\nFormatted Summary Table:")
print(formatted_summary.to_string())

# =========================================================================
# Task 3: Visual Comparison (Heatmap)
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 3] Visual Comparison (Heatmap)")
print("-" * 70)

# Normalize metrics 0-1 for intuitive color scaling where 1.0 = Best (Green) and 0.0 = Worst (Red)
norm_df = segment_metrics[['avg_ltv', 'churn_rate', 'avg_tickets']].copy()
norm_df['avg_ltv_norm'] = (norm_df['avg_ltv'] - norm_df['avg_ltv'].min()) / (norm_df['avg_ltv'].max() - norm_df['avg_ltv'].min())
norm_df['churn_norm'] = 1.0 - (norm_df['churn_rate'] - norm_df['churn_rate'].min()) / (norm_df['churn_rate'].max() - norm_df['churn_rate'].min())
norm_df['tickets_norm'] = 1.0 - (norm_df['avg_tickets'] - norm_df['avg_tickets'].min()) / (norm_df['avg_tickets'].max() - norm_df['avg_tickets'].min())

color_matrix = norm_df[['avg_ltv_norm', 'churn_norm', 'tickets_norm']]
color_matrix.columns = ['Avg LTV ($)', 'Churn Rate (%)', 'Avg Support Tickets']

# Matrix annotations with raw formatted values
annot_matrix = np.array([
    [
        f"${segment_metrics.loc[idx, 'avg_ltv']:,.0f}",
        f"{segment_metrics.loc[idx, 'churn_rate']:.1%}",
        f"{segment_metrics.loc[idx, 'avg_tickets']:.1f}"
    ]
    for idx in segment_metrics.index
])

plt.figure(figsize=(10, 6))
sns.heatmap(
    color_matrix,
    annot=annot_matrix,
    fmt='',
    cmap='RdYlGn',
    vmin=0,
    vmax=1,
    cbar_kws={'label': 'Performance Index (1.0 = Favorable / Green, 0.0 = High Risk / Red)'},
    linewidths=1.5,
    annot_kws={"size": 12, "weight": "bold"}
)

plt.title('Logistics Customer Segment Metrics Comparison Heatmap', fontsize=14, pad=15, weight='bold')
plt.xlabel('Customer Metrics', fontsize=12, labelpad=10)
plt.ylabel('Customer Segment', fontsize=12, labelpad=10)
plt.tight_layout()

heatmap_path_root = 'segment_heatmap.png'
heatmap_path_output = 'output/segment_heatmap.png'

plt.savefig(heatmap_path_root, dpi=300)
plt.savefig(heatmap_path_output, dpi=300)
plt.close()

print(f"✓ Heatmap visualization saved to: {heatmap_path_root}")
print(f"✓ Heatmap visualization duplicate saved to: {heatmap_path_output}")

# =========================================================================
# Task 4: Top and Bottom Performer Analysis
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 4] Top and Bottom Performer Analysis")
print("-" * 70)

top_segment = segment_metrics['avg_ltv'].idxmax()
top_value = segment_metrics.loc[top_segment, 'avg_ltv']

high_churn = segment_metrics['churn_rate'].idxmax()

insights = f"""
HIGHEST VALUE: {top_segment} = ${top_value:,.0f}
HIGHEST CHURN: {high_churn} = {segment_metrics.loc[high_churn, 'churn_rate']:.1%}
BEST RETENTION: {segment_metrics['avg_retention'].idxmax()}
"""

print(insights)

# =========================================================================
# Task 5: Business-Facing Insights
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 5] Business-Facing Insights")
print("-" * 70)

business_summary = """
SEGMENT STRATEGY SUMMARY:

Enterprise (5% of base, $150k LTV, 1% churn):
- Highest value, lowest churn customer segment. Enterprise clients drive bulk volume across primary transit corridors with high SLA commitments.
- Action: Maintain premium dedicated account support, proactive delay monitoring, and priority warehouse transfer routing to prevent cascading delivery disruptions and protect contract renewals.

SMB (40% of base, $12k LTV, 12% churn):
- Middle value, highest churn risk segment experiencing severe operational friction evidenced by elevated support ticket volume (4.2 tickets/customer).
- Action: Improve onboarding workflows, implement automated route exception notifications, and offer self-service tier support to streamline delivery issue resolution and reduce customer churn.

Startup (55% of base, $2k LTV, 8% churn):
- Lowest average lifetime value, moderate churn rate with solid retention span (345 days average retention).
- Action: Deploy automated self-service analytics, digital learning hubs, and standardized API integrations so startups can scale parcel shipments with minimal manual support touchpoints.
"""

print(business_summary)

# Export segment metrics to CSV in output directory
csv_out = 'output/segment_metrics.csv'
segment_summary.to_csv(csv_out)
print(f"✓ Saved segment summary metrics to {csv_out}")
