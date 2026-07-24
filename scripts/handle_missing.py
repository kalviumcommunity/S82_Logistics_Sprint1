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

def analyze_missing_values(df):
    """
    Compute null counts and percentages before treatment.
    
    Returns: DataFrame with analysis of missing data by column
    """
    missing_analysis = pd.DataFrame({
        'column': df.columns,
        'null_count': df.isnull().sum().values,
        'null_percentage': (df.isnull().sum() / len(df) * 100).round(2).values,
        'data_type': df.dtypes.values,
        'null_meaning': ''  # To be filled based on column context
    })
    
    print("="*70)
    print("BEFORE IMPUTATION - Missing Value Analysis")
    print("="*70)
    print(missing_analysis.to_string(index=False))
    print(f"\nTotal rows: {len(df)}")
    print(f"Total cells: {len(df) * len(df.columns)}")
    print(f"Missing cells: {df.isnull().sum().sum()}")
    print("="*70)
    
    return missing_analysis


def impute_mean_median(df, numerical_cols, strategy='median'):
    """Fill numerical nulls with mean or median."""
    df_imputed = df.copy()
    for col in numerical_cols:
        if col in df_imputed.columns and df_imputed[col].isnull().sum() > 0:
            null_count = int(df_imputed[col].isnull().sum())
            fill_value = float(df_imputed[col].median() if strategy == 'median' else df_imputed[col].mean())
            df_imputed[col] = df_imputed[col].fillna(fill_value)
            print(f"  [OK] {col}: filled {null_count} nulls with {strategy} ({fill_value:.2f})")
    return df_imputed


def impute_mode(df, categorical_cols):
    """Fill categorical nulls with mode (most common value)."""
    df_imputed = df.copy()
    for col in categorical_cols:
        if col in df_imputed.columns and df_imputed[col].isnull().sum() > 0:
            null_count = int(df_imputed[col].isnull().sum())
            mode_val = df_imputed[col].mode()[0]
            df_imputed[col] = df_imputed[col].fillna(mode_val)
            print(f"  [OK] {col}: filled {null_count} nulls with mode '{mode_val}'")
    return df_imputed


def impute_forward_fill(df, time_series_cols):
    """Fill with previous value (for time-series data)."""
    df_imputed = df.copy()
    for col in time_series_cols:
        if col in df_imputed.columns and df_imputed[col].isnull().sum() > 0:
            null_count = int(df_imputed[col].isnull().sum())
            df_imputed[col] = df_imputed[col].ffill()
            print(f"  [OK] {col}: forward-filled {null_count} nulls")
    return df_imputed


def drop_rows_with_nulls(df, critical_cols):
    """Drop rows where critical columns are null."""
    rows_before = len(df)
    existing_cols = [c for c in critical_cols if c in df.columns]
    df_imputed = df.dropna(subset=existing_cols)
    rows_dropped = rows_before - len(df_imputed)
    print(f"  [OK] Dropped {rows_dropped} rows with null in: {existing_cols}")
    return df_imputed


def document_imputation_decisions(df_original, df_imputed):
    """Document all imputation decisions with business justification."""
    
    os.makedirs('output', exist_ok=True)

    decisions = {
        'amount': {
            'column_type': 'numerical',
            'null_count_before': int(df_original['amount'].isnull().sum() if 'amount' in df_original else 0),
            'strategy': 'median_imputation',
            'value_used': float(df_original['amount'].median()) if 'amount' in df_original and not pd.isna(df_original['amount'].median()) else None,
            'business_reasoning': 'Median purchase amount is representative of typical transaction. Mean would be skewed by high-value outliers. Maintains distribution integrity.',
            'risk_assessment': 'Low - median is stable metric resistant to outliers'
        },
        'email': {
            'column_type': 'categorical_identifier',
            'null_count_before': int(df_original['email'].isnull().sum() if 'email' in df_original else 0),
            'strategy': 'drop_rows',
            'rows_affected': int(df_original['email'].isnull().sum() if 'email' in df_original else 0),
            'business_reasoning': 'Email is critical for customer contact and marketing campaigns. Rows without email cannot be used for outreach. Data is incomplete.',
            'risk_assessment': 'Low - only affects small percentage of data'
        },
        'status_date': {
            'column_type': 'datetime_series',
            'null_count_before': int(df_original['status_date'].isnull().sum() if 'status_date' in df_original else 0),
            'strategy': 'forward_fill',
            'interpretation': 'Assumes last known status date is still valid until changed',
            'business_reasoning': 'For time-series analysis, forward fill preserves temporal continuity. Status typically does not change frequently.',
            'risk_assessment': 'Medium - assumes no change between observations'
        },
        'quantity': {
            'column_type': 'numerical',
            'null_count_before': int(df_original['quantity'].isnull().sum() if 'quantity' in df_original else 0),
            'strategy': 'median_imputation',
            'value_used': float(df_original['quantity'].median()) if 'quantity' in df_original and not pd.isna(df_original['quantity'].median()) else None,
            'business_reasoning': 'Order quantity uses median value to represent standard shipment volume.',
            'risk_assessment': 'Low - maintains integer distribution integrity'
        },
        'category': {
            'column_type': 'categorical',
            'null_count_before': int(df_original['category'].isnull().sum() if 'category' in df_original else 0),
            'strategy': 'mode_imputation',
            'value_used': str(df_original['category'].mode()[0]) if 'category' in df_original and not df_original['category'].mode().empty else 'UNKNOWN',
            'business_reasoning': 'Fills missing category with most frequent classification tier.',
            'risk_assessment': 'Low - aligns with predominant category distribution'
        },
        'dwell_duration_min': {
            'column_type': 'numerical',
            'null_count_before': int(df_original['dwell_duration_min'].isnull().sum() if 'dwell_duration_min' in df_original else 0),
            'strategy': 'median_imputation',
            'value_used': float(df_original['dwell_duration_min'].median()) if 'dwell_duration_min' in df_original and not pd.isna(df_original['dwell_duration_min'].median()) else None,
            'business_reasoning': 'Replaces missing warehouse transfer dwell time with median duration to avoid skewing route delay prediction.',
            'risk_assessment': 'Low - median preserves operational route baseline'
        }
    }
    
    with open('output/imputation_decisions.json', 'w') as f:
        json.dump(decisions, f, indent=2, default=str)
    
    return decisions


def validate_imputation(df_original, df_imputed):
    """Compare metrics before and after imputation."""
    
    print("\n" + "="*70)
    print("AFTER IMPUTATION - Validation Report")
    print("="*70)
    print(f"Total rows before: {len(df_original)}")
    print(f"Total rows after:  {len(df_imputed)}")
    print(f"Rows removed: {len(df_original) - len(df_imputed)}")
    print(f"\nTotal nulls before: {df_original.isnull().sum().sum()}")
    print(f"Total nulls after:  {df_imputed.isnull().sum().sum()}")
    
    missing_after = pd.DataFrame({
        'column': df_imputed.columns,
        'null_count_after': df_imputed.isnull().sum().values,
        'null_percentage_after': (df_imputed.isnull().sum() / len(df_imputed) * 100).round(2).values
    })
    
    print("\nNull values by column after imputation:")
    print(missing_after.to_string(index=False))
    print("="*70)
    
    return missing_after


if __name__ == "__main__":
    os.makedirs('data/raw', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('output', exist_ok=True)

    # Load data
    raw_path = 'data/raw/raw_data.csv' if os.path.exists('data/raw/raw_data.csv') else 'data/raw/missing_data.csv'
    df = pd.read_csv(raw_path)
    df_original = df.copy()
    
    # Step 1: Analyze missing values before treatment
    print("Step 1: Analyzing missing values...")
    analyze_missing_values(df)
    
    # Step 2: Apply strategy-specific imputation
    print("\nStep 2: Applying imputation strategies...")
    
    # Drop rows with nulls in critical columns
    df = drop_rows_with_nulls(df, ['customer_id', 'email'])
    
    # Impute numerical columns
    numerical_cols = [c for c in ['amount', 'quantity', 'dwell_duration_min'] if c in df.columns]
    df = impute_mean_median(df, numerical_cols, strategy='median')
    
    # Impute categorical columns
    categorical_cols = [c for c in ['name', 'category', 'region', 'warehouse_id', 'delay_reason_code'] if c in df.columns]
    df = impute_mode(df, categorical_cols)
    
    # Impute time-series columns
    time_series_cols = [c for c in ['last_updated', 'status_date'] if c in df.columns]
    df = impute_forward_fill(df, time_series_cols)
    
    # Step 3: Document decisions
    print("\nStep 3: Documenting imputation decisions...")
    document_imputation_decisions(df_original, df)
    
    # Step 4: Validate results
    print("\nStep 4: Validating imputation...")
    validate_imputation(df_original, df)
    
    # Save cleaned data
    df.to_csv('data/processed/cleaned_data.csv', index=False)
    print("\n[OK] Cleaned data saved to data/processed/cleaned_data.csv")
