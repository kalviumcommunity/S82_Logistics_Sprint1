import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# 1. Create a mock dataset for segmentation
np.random.seed(42)
n = 1000
customer_types = np.random.choice(['Enterprise', 'SMB', 'Startup'], size=n, p=[0.05, 0.40, 0.55])
data = []
for ct in customer_types:
    if ct == 'Enterprise':
        ltv = np.random.normal(150000, 20000)
        churn = np.random.binomial(1, 0.01)
        tickets = np.random.poisson(15)
        retention = np.random.normal(1800, 200)
    elif ct == 'SMB':
        ltv = np.random.normal(8000, 2000)
        churn = np.random.binomial(1, 0.12)
        tickets = np.random.poisson(5)
        retention = np.random.normal(300, 50)
    else:  # Startup
        ltv = np.random.normal(2000, 500)
        churn = np.random.binomial(1, 0.08)
        tickets = np.random.poisson(2)
        retention = np.random.normal(400, 60)
    
    data.append({
        'customer_id': np.random.randint(10000, 99999),
        'customer_type': ct,
        'lifetime_value': max(ltv, 0),
        'churn': churn,
        'support_tickets': tickets,
        'retention_days': max(retention, 0)
    })

df = pd.DataFrame(data)

print("--- TASK 1: Define Segments and Compute Metrics ---")
segment_metrics = df.groupby('customer_type').agg({
    'lifetime_value': 'mean',
    'churn': 'mean',
    'support_tickets': 'mean',
    'retention_days': 'mean',
    'customer_id': 'count'
})
segment_metrics.columns = ['avg_ltv', 'churn_rate', 'avg_tickets', 'avg_retention', 'count']
print(segment_metrics)

print("\n--- TASK 2: Summary Statistics Table ---")
segment_summary = segment_metrics.copy()
segment_summary['ltv_rank'] = segment_summary['avg_ltv'].rank(ascending=False)
segment_summary['churn_rank'] = segment_summary['churn_rate'].rank(ascending=True)

# Format for readability
formatted_summary = segment_summary.copy()
formatted_summary['avg_ltv'] = formatted_summary['avg_ltv'].apply(lambda x: f'${x:,.0f}')
formatted_summary['churn_rate'] = formatted_summary['churn_rate'].apply(lambda x: f'{x:.1%}')
print(formatted_summary[['avg_ltv', 'ltv_rank', 'churn_rate', 'churn_rank', 'count']])

print("\n--- TASK 3: Visual Comparison ---")
# Heatmap
plt.figure(figsize=(10, 6))

# Scaling the metrics for better visual comparison in a heatmap without skewing the entire chart to LTV
heatmap_data = segment_metrics[['avg_ltv', 'churn_rate', 'avg_tickets']].copy()
# Min-max scale each column to [0,1] so colors are relative within the column
heatmap_normalized = (heatmap_data - heatmap_data.min()) / (heatmap_data.max() - heatmap_data.min())

sns.heatmap(heatmap_normalized, annot=heatmap_data, cmap='RdYlGn', cbar_kws={'label': 'Normalized Scale'}, fmt=".2f")
plt.title('Segment Comparison Heatmap')
plt.tight_layout()
plt.savefig('segment_heatmap.png')
print("Heatmap saved to 'segment_heatmap.png'")


print("\n--- TASK 4: Top and Bottom Performer Analysis ---")
# Highest value segment
top_segment = segment_metrics['avg_ltv'].idxmax()
top_value = segment_metrics.loc[top_segment, 'avg_ltv']

# Highest churn segment
high_churn = segment_metrics['churn_rate'].idxmax()

insights = f"""
HIGHEST VALUE: {top_segment} = ${top_value:,.0f}
HIGHEST CHURN: {high_churn} = {segment_metrics.loc[high_churn, 'churn_rate']:.1%}
BEST RETENTION: {segment_metrics['avg_retention'].idxmax()}
"""
print(insights)

print("\n--- TASK 5: Business-Facing Insights ---")
business_summary = """
SEGMENT STRATEGY SUMMARY:

Enterprise (5% of base, $150k LTV, 1% churn):
- Highest value, lowest churn
- Action: Maintain premium support, retention focus

SMB (40% of base, $8k LTV, 12% churn):
- Middle value, high churn risk
- Action: Improve onboarding, cheaper support tier

Startup (55% of base, $2k LTV, 8% churn):
- Lowest value, moderate churn
- Action: Self-service, education-focused
"""
print(business_summary)
