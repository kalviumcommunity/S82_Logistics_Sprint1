import os
import sys
import json
import pandas as pd
import numpy as np

# Ensure stdout uses UTF-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def compute_ratio_features(df):
    """
    Task 1: Compute Ratio Features.
    """
    df_feat = df.copy()
    print("\n" + "="*60)
    print("TASK 1: COMPUTE RATIO FEATURES")
    print("="*60)
    
    df_feat['transactions_per_month'] = df_feat['total_transactions'] / (df_feat['days_as_customer'] / 30)
    df_feat['avg_spend_per_transaction'] = df_feat['total_spent'] / df_feat['total_transactions']
    df_feat['lifetime_value_per_month'] = df_feat['total_spent'] / (df_feat['days_as_customer'] / 30)
    
    print("Ratio Features Summary Statistics:")
    print(df_feat[['transactions_per_month', 'avg_spend_per_transaction', 'lifetime_value_per_month']].describe().to_string())
    
    return df_feat


def bin_equal_width_tiers(df):
    """
    Task 2: Binning with Equal-Width / Custom Bins.
    """
    df_feat = df.copy()
    print("\n" + "="*60)
    print("TASK 2: BINNING WITH EQUAL-WIDTH BINS")
    print("="*60)
    
    df_feat['engagement_tier'] = pd.cut(
        df_feat['transactions_per_month'],
        bins=[0, 2, 10, float('inf')],
        labels=['low', 'medium', 'high']
    )
    
    print("Engagement Tier Distribution:")
    print(df_feat['engagement_tier'].value_counts().to_string())
    
    return df_feat


def bin_quantile_tiers(df):
    """
    Task 3: Binning with Quantiles.
    """
    df_feat = df.copy()
    print("\n" + "="*60)
    print("TASK 3: BINNING WITH QUANTILES")
    print("="*60)
    
    df_feat['spend_quartile'] = pd.qcut(
        df_feat['total_spent'],
        q=4,
        labels=['Q1', 'Q2', 'Q3', 'Q4']
    )
    
    print("Spend Quartile Distribution:")
    print(df_feat['spend_quartile'].value_counts().to_string())
    
    return df_feat


def compute_composite_rfm_score(df):
    """
    Task 4: Composite Score (RFM Score).
    """
    df_feat = df.copy()
    print("\n" + "="*60)
    print("TASK 4: COMPOSITE RFM SCORE")
    print("="*60)
    
    # Recency: Lower days since last purchase -> higher score (5 to 1)
    df_feat['recency_score'] = pd.qcut(df_feat['days_since_last_purchase'], q=5, labels=[5, 4, 3, 2, 1])
    # Frequency: Higher purchase count -> higher score (1 to 5)
    df_feat['frequency_score'] = pd.qcut(df_feat['purchase_count'], q=5, labels=[1, 2, 3, 4, 5])
    # Monetary: Higher total spent -> higher score (1 to 5)
    df_feat['monetary_score'] = pd.qcut(df_feat['total_spent'], q=5, labels=[1, 2, 3, 4, 5])
    
    df_feat['rfm_score'] = (
        df_feat['recency_score'].astype(int) + 
        df_feat['frequency_score'].astype(int) + 
        df_feat['monetary_score'].astype(int)
    )
    
    print(f"RFM Composite Score Range: {df_feat['rfm_score'].min()} - {df_feat['rfm_score'].max()}")
    print("RFM Score Distribution Sample:")
    print(df_feat['rfm_score'].value_counts().sort_index().to_string())
    
    return df_feat


def validate_features(df):
    """
    Task 5: Feature Validation.
    """
    print("\n" + "="*60)
    print("TASK 5: FEATURE VALIDATION")
    print("="*60)
    
    os.makedirs('output', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    
    print("Engagement Tier Distribution:")
    print(df['engagement_tier'].value_counts().to_string())
    
    print(f"\nRFM Score Range: {df['rfm_score'].min()} - {df['rfm_score'].max()}")
    
    missing_counts = df[['engagement_tier', 'spend_quartile', 'rfm_score']].isna().sum()
    print("\nMissing Values Count:")
    print(missing_counts.to_string())
    assert missing_counts.sum() == 0, "Validation failed: NaNs introduced in engineered features!"
    print("✓ Confirmed: No NaNs introduced across engineered features.")
    
    # Export summary report JSON
    summary_report = {
        'total_records': len(df),
        'engagement_tier_counts': df['engagement_tier'].value_counts().to_dict(),
        'spend_quartile_counts': df['spend_quartile'].value_counts().to_dict(),
        'rfm_score_stats': {
            'min': int(df['rfm_score'].min()),
            'max': int(df['rfm_score'].max()),
            'mean': float(df['rfm_score'].mean()),
            'median': float(df['rfm_score'].median())
        },
        'missing_values_check': missing_counts.to_dict(),
        'timestamp': pd.Timestamp.now().isoformat()
    }
    
    with open('output/feature_summary.json', 'w') as f:
        json.dump(summary_report, f, indent=2)
    print("\n✓ Feature summary saved to output/feature_summary.json")
    
    df.to_csv('data/processed/engineered_customer_features.csv', index=False)
    print("✓ Engineered customer dataset saved to data/processed/engineered_customer_features.csv")
    
    return summary_report


if __name__ == "__main__":
    print("\n" + "="*70)
    print("FEATURE ENGINEERING PIPELINE")
    print("="*70)
    
    # Load raw dataset
    df = pd.read_csv('data/raw/customer_activity_data.csv')
    print("Initial Dataset Head:")
    print(df.head(5).to_string())
    
    # Task 1: Ratio Features
    df = compute_ratio_features(df)
    
    # Task 2: Equal-Width / Custom Binning
    df = bin_equal_width_tiers(df)
    
    # Task 3: Quantile Binning
    df = bin_quantile_tiers(df)
    
    # Task 4: Composite RFM Score
    df = compute_composite_rfm_score(df)
    
    # Task 5: Feature Validation & Export
    summary = validate_features(df)
