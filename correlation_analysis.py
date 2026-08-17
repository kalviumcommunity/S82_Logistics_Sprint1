"""
Correlation & Relationship Analysis
===================================
Assignment 2.29

Problem Context (Logistics Domain)
----------------------------------
Analyze relationships between operational metrics (like yard_queue_count, actual_dwell, etc.)
and delivery delays (dwell_duration_seconds). Ensure we distinguish between metrics that merely 
move together versus those that have a causal relationship.
"""

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import json
import os

# Create output directory if it doesn't exist
os.makedirs('output', exist_ok=True)

# Load dataset
df = pd.read_csv("data/cascading_logistics_telemetry.csv")
numeric_df = df.select_dtypes(include='number')

print("=" * 60)
print("Correlation & Relationship Analysis - Logistics Telemetry")
print("=" * 60)

# -------------------------------------------------------------
# Task 1: Compute Pearson and Spearman Correlation
# -------------------------------------------------------------
print("\nTask 1: Compute Pearson and Spearman Correlation")
print("-" * 60)

# Pearson (linear relationships)
pearson_corr = numeric_df.corr(method='pearson')

# Spearman (monotonic, robust to outliers)
spearman_corr = numeric_df.corr(method='spearman')

# Compare which correlations differ for the target variable 'dwell_duration_seconds'
comparison = pd.DataFrame({
    'pearson': pearson_corr['dwell_duration_seconds'],
    'spearman': spearman_corr['dwell_duration_seconds']
})
print(comparison)

# -------------------------------------------------------------
# Task 2: Visualize Correlation Heatmap
# -------------------------------------------------------------
print("\nTask 2: Visualize Correlation Heatmap")
print("-" * 60)

fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(pearson_corr, annot=True, cmap='coolwarm', center=0, ax=ax, fmt=".2f")
ax.set_title('Feature Correlation Matrix')
plt.tight_layout()
heatmap_path = 'output/correlation_heatmap.png'
plt.savefig(heatmap_path)
print(f"Heatmap saved to {heatmap_path}")

# -------------------------------------------------------------
# Task 3: Identify Strongly Correlated Pairs
# -------------------------------------------------------------
print("\nTask 3: Identify Strongly Correlated Pairs")
print("-" * 60)

# Flatten and find strong correlations
corr_flat = pearson_corr.unstack()
strong = corr_flat[corr_flat.abs() > 0.7].sort_values(ascending=False)

# Exclude self-correlation (r=1.0)
strong_pairs = strong[strong != 1.0].head(10)
print(strong_pairs)

# -------------------------------------------------------------
# Task 4: Business Interpretation
# -------------------------------------------------------------
print("\nTask 4: Business Interpretation")
print("-" * 60)

# For each strong correlation, reason about causation
analysis = {
    'actual_dwell <-> dwell_duration_seconds': {
        'correlation': round(pearson_corr.loc['actual_dwell', 'dwell_duration_seconds'], 2),
        'possible_directions': [
            'actual_dwell -> dwell_duration_seconds (time spent at facility directly translates to total delay)',
            'dwell_duration_seconds -> actual_dwell (overall delay constraints force longer facility dwells)',
            'operational_inefficiency -> both (underlying bottleneck causes both)'
        ],
        'data_indicates': 'These variables are mathematically linked; actual_dwell is practically a component of dwell_duration_seconds. High correlation is expected due to collinearity, not distinct causation.',
        'action': 'Drop one of the variables during modeling to avoid multicollinearity.'
    }
}
print(json.dumps(analysis, indent=2))

# -------------------------------------------------------------
# Task 5: Feature Selection Based on Correlation
# -------------------------------------------------------------
print("\nTask 5: Feature Selection Based on Correlation")
print("-" * 60)

# High correlation means redundancy - keep the more interpretable feature
# 'actual_dwell' and 'dwell_duration_seconds' are highly correlated. We keep 'dwell_duration_seconds' as our target.
df_features = numeric_df.copy()

if 'actual_dwell' in df_features.columns:
    print(f"Dropping 'actual_dwell' as it is redundant with 'dwell_duration_seconds'.")
    df_features = df_features.drop('actual_dwell', axis=1)

print("\nUpdated Feature Correlation Matrix (Partial):")
print(df_features.corr()[['dwell_duration_seconds']])
