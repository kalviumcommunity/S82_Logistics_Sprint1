import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

# Ensure UTF-8 output handling for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

os.makedirs('output', exist_ok=True)

# Generate synthetic dataset matching target distribution properties (mean ~450, skewness ~2.5)
np.random.seed(42)
n_samples = 10000
raw_revenue = np.random.lognormal(mean=5.6, sigma=1.05, size=n_samples)
# Scale mean to approximately 450
raw_revenue = raw_revenue * (450.0 / raw_revenue.mean())
df = pd.DataFrame({'revenue': raw_revenue})

print("=" * 70)
print("LOGISTICS ROUTE REVENUE DISTRIBUTION & SKEWNESS ANALYSIS")
print("=" * 70)

# =========================================================================
# Task 1: Distribution Plots
# =========================================================================
print("\n[TASK 1] Rendering Distribution Plots (Histogram & KDE)...")
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Histogram
axes[0].hist(df['revenue'], bins=50, color='#3b82f6', edgecolor='black', alpha=0.8)
axes[0].set_title('Revenue Distribution (Histogram)')
axes[0].set_xlabel('Revenue')
axes[0].set_ylabel('Frequency')

# KDE
df['revenue'].plot(kind='density', ax=axes[1], color='#ef4444', linewidth=2)
axes[1].set_title('Revenue Distribution (KDE)')
axes[1].set_xlabel('Revenue')

plt.tight_layout()
dist_plot_path = 'output/revenue_distribution.png'
plt.savefig(dist_plot_path)
plt.close()
print(f"✓ Histogram & KDE plots saved to: {dist_plot_path}")

# =========================================================================
# Task 2: Compute Skewness and Kurtosis
# =========================================================================
print("\n[TASK 2] Computing Skewness and Kurtosis...")
skewness = stats.skew(df['revenue'])
kurtosis = stats.kurtosis(df['revenue'])

print(f"Skewness: {skewness:.2f}")
print(f"Kurtosis: {kurtosis:.2f}")

if abs(skewness) > 1:
    print("Highly skewed - use median not mean")
if kurtosis > 3:
    print("Heavy tails - expect outliers")

# =========================================================================
# Task 3: Identify Abnormal Patterns
# =========================================================================
print("\n[TASK 3] Identifying Summary Metrics & Quantiles...")
print("\nDescribe Summary:")
print(df['revenue'].describe().to_string())

print("\nPercentiles:")
percentiles = df['revenue'].quantile([0.25, 0.5, 0.75, 0.9, 0.95, 0.99])
print(percentiles.to_string())

gap_75_90 = percentiles[0.9] - percentiles[0.75]
print(f"\nGap between 0.75 and 0.9 percentiles: ${gap_75_90:.2f}")

# =========================================================================
# Task 4: Compare Segment Distributions
# =========================================================================
print("\n[TASK 4] Comparing High-Value vs Low-Value Segments...")
high_value = df[df['revenue'] > df['revenue'].quantile(0.75)]
low_value = df[df['revenue'] < df['revenue'].quantile(0.25)]

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

axes[0].hist(high_value['revenue'], bins=30, alpha=0.7, label='High-Value', color='#10b981', edgecolor='black')
axes[0].hist(low_value['revenue'], bins=30, alpha=0.7, label='Low-Value', color='#f59e0b', edgecolor='black')
axes[0].legend()
axes[0].set_title('Revenue: High vs Low Value Customers')
axes[0].set_xlabel('Revenue')
axes[0].set_ylabel('Count')

high_value['revenue'].plot(kind='density', ax=axes[1], label='High-Value', color='#10b981', linewidth=2)
low_value['revenue'].plot(kind='density', ax=axes[1], label='Low-Value', color='#f59e0b', linewidth=2)
axes[1].legend()
axes[1].set_title('Density: High vs Low Value Segments')
axes[1].set_xlabel('Revenue')

plt.tight_layout()
segment_plot_path = 'output/revenue_segments.png'
plt.savefig(segment_plot_path)
plt.close()
print(f"✓ Segment comparison plot saved to: {segment_plot_path}")

print(f"High-value: mean={high_value['revenue'].mean():.0f}, median={high_value['revenue'].median():.0f}")
print(f"Low-value: mean={low_value['revenue'].mean():.0f}, median={low_value['revenue'].median():.0f}")

# =========================================================================
# Task 5: Business Interpretation
# =========================================================================
print("\n[TASK 5] Business Interpretation Synthesis")
interpretation = f"""
Revenue Distribution Analysis:

Skewness: {skewness:.2f} → {"Highly right-skewed" if skewness > 1 else "Moderate"}
Mean: ${df['revenue'].mean():.0f}
Median: ${df['revenue'].median():.0f}
Interpretation: {'Most customers are small; few are huge enterprise accounts' if skewness > 1 else 'Balanced distribution'}

Kurtosis: {kurtosis:.2f} → {"Fat tails (outliers)" if kurtosis > 3 else "Normal"}
Max: ${df['revenue'].max():.0f}
Top 1%: ${df['revenue'].quantile(0.99):.0f}

Business Action: {'Segment into small/enterprise for different strategies' if skewness > 1 else 'Uniform strategy'}
"""

print(interpretation)
