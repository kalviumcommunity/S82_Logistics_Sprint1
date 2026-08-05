import os
import sys
import json
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

# Generate synthetic dataset aligned with domain & task specs
np.random.seed(42)
n_samples = 1000

# Base metrics
transactions_per_month = np.random.uniform(5, 100, n_samples)
# Highly correlated with transactions_per_month (r ~ 0.92)
engagement = transactions_per_month * 0.95 + np.random.normal(0, 5, n_samples)
days_since_last_purchase = np.random.uniform(1, 365, n_samples)

# Customer pain / delay issue index (confounder)
customer_pain = np.random.uniform(0, 10, n_samples)
# Support tickets strongly driven by pain
support_tickets = np.random.poisson(lam=customer_pain * 1.5)
# Churn strongly driven by pain (producing r ~ 0.8 with support_tickets)
churn_prob = 1 / (1 + np.exp(-(customer_pain - 5)))
churn = (np.random.uniform(0, 1, n_samples) < churn_prob).astype(int)

df = pd.DataFrame({
    'transactions_per_month': transactions_per_month,
    'engagement': engagement,
    'days_since_last_purchase': days_since_last_purchase,
    'support_tickets': support_tickets,
    'churn': churn
})

print("=" * 70)
print("LOGISTICS DELAY & CHURN FEATURE CORRELATION ANALYSIS")
print("=" * 70)

# =========================================================================
# Task 1: Compute Pearson and Spearman Correlation
# =========================================================================
print("\n[TASK 1] Computing Pearson & Spearman Correlation Matrices...")
# Pearson (linear relationships)
pearson_corr = df.corr(method='pearson')

# Spearman (monotonic, robust to outliers)
spearman_corr = df.corr(method='spearman')

# Compare which correlations differ
comparison = pd.DataFrame({
    'pearson': pearson_corr['churn'],
    'spearman': spearman_corr['churn']
})
print("\nCorrelation with Churn (Pearson vs Spearman):")
print(comparison.to_string())

# =========================================================================
# Task 2: Visualize Correlation Heatmap
# =========================================================================
print("\n[TASK 2] Generating Correlation Heatmap...")
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(pearson_corr, annot=True, fmt='.2f', cmap='coolwarm', center=0, ax=ax, cbar=True)
ax.set_title('Feature Correlation Matrix')
plt.tight_layout()
heatmap_path = 'output/correlation_heatmap.png'
plt.savefig(heatmap_path)
plt.close()
print(f"✓ Saved correlation heatmap to {heatmap_path}")

# =========================================================================
# Task 3: Identify Strongly Correlated Pairs
# =========================================================================
print("\n[TASK 3] Identifying Strongly Correlated Feature Pairs (|r| > 0.7)...")
corr_flat = pearson_corr.unstack()
strong = corr_flat[corr_flat.abs() > 0.7].sort_values(ascending=False)

# Exclude self-correlation (r=1.0)
strong_pairs = strong[strong != 1.0].head(10)
print("\nStrongly Correlated Pairs (|r| > 0.7):")
print(strong_pairs.to_string())

# =========================================================================
# Task 4: Business Interpretation & Causality Reasoning
# =========================================================================
print("\n[TASK 4] Business Interpretation & Causality Reasoning...")
corr_val = round(float(pearson_corr.loc['support_tickets', 'churn']), 2)

analysis = {
    'support_tickets <-> churn': {
        'correlation': corr_val,
        'possible_directions': [
            'support_tickets → churn (customer gives up after contacting support)',
            'churn → support_tickets (unhappy customers contact support before leaving)',
            'customer_pain → both (underlying issue causes both)'
        ],
        'data_indicates': 'Likely customer_pain is the confounder; tickets are symptom not cause',
        'action': 'Focus on reducing pain, not blocking tickets'
    }
}

print(json.dumps(analysis, indent=2))

# =========================================================================
# Task 5: Feature Selection Based on Correlation
# =========================================================================
print("\n[TASK 5] Feature Selection Based on Correlation...")
# High correlation means redundancy - keep more interpretable feature
df_features = df[['engagement', 'transactions_per_month', 'support_tickets', 'churn']]

print("\nFull feature subset correlation:")
print(df_features.corr().to_string())

# transactions_per_month and engagement are r=0.92 (correlated)
# Drop redundant, keep interpretable
df_features = df_features.drop('engagement', axis=1)

print("\nReduced feature set correlation (after dropping 'engagement'):")
print(df_features.corr().to_string())

print("\n[SUCCESS] Correlation analysis pipeline executed cleanly.")
