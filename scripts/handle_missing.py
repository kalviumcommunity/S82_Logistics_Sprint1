import pandas as pd
import numpy as np
import json
import os

# ---------------------------------------------------------------------------
# Task 1 - Analyze Missing Values Before Any Treatment
# ---------------------------------------------------------------------------

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
        'null_meaning': ''   # filled in document_imputation_decisions
    })

    print("=" * 70)
    print("BEFORE IMPUTATION - Missing Value Analysis")
    print("=" * 70)
    print(missing_analysis.to_string(index=False))
    print(f"\nTotal rows   : {len(df)}")
    print(f"Total cells  : {len(df) * len(df.columns)}")
    print(f"Missing cells: {df.isnull().sum().sum()}")
    print("=" * 70)

    return missing_analysis


# ---------------------------------------------------------------------------
# Task 2 - Implement Multiple Imputation Strategies
# ---------------------------------------------------------------------------

def impute_mean_median(df, numerical_cols, strategy='median'):
    """Fill numerical nulls with mean or median."""
    df_imputed = df.copy()
    for col in numerical_cols:
        if col not in df_imputed.columns:
            continue
        null_count = df_imputed[col].isnull().sum()
        if null_count > 0:
            fill_value = (df_imputed[col].median()
                          if strategy == 'median'
                          else df_imputed[col].mean())
            df_imputed[col] = df_imputed[col].fillna(fill_value)
            print(f"  [OK] {col}: filled {null_count} null(s) with "
                  f"{strategy} ({fill_value:.2f})")
    return df_imputed


def impute_mode(df, categorical_cols):
    """Fill categorical nulls with mode (most common value)."""
    df_imputed = df.copy()
    for col in categorical_cols:
        if col not in df_imputed.columns:
            continue
        null_count = df_imputed[col].isnull().sum()
        if null_count > 0:
            mode_val = df_imputed[col].mode()[0]
            df_imputed[col] = df_imputed[col].fillna(mode_val)
            print(f"  [OK] {col}: filled {null_count} null(s) with "
                  f"mode '{mode_val}'")
    return df_imputed


def impute_forward_fill(df, time_series_cols):
    """Fill with previous value (for time-series ordered data only)."""
    df_imputed = df.copy()
    for col in time_series_cols:
        if col not in df_imputed.columns:
            continue
        null_count = df_imputed[col].isnull().sum()
        if null_count > 0:
            df_imputed[col] = df_imputed[col].ffill()
            print(f"  [OK] {col}: forward-filled {null_count} null(s)")
    return df_imputed


def drop_rows_with_nulls(df, critical_cols):
    """Drop rows where critical identifier columns are null."""
    rows_before = len(df)
    df_imputed = df.dropna(subset=critical_cols).reset_index(drop=True)
    rows_dropped = rows_before - len(df_imputed)
    print(f"  [OK] Dropped {rows_dropped} row(s) with null in: {critical_cols}")
    return df_imputed


# ---------------------------------------------------------------------------
# Task 3 - Document Imputation Decisions With Business Reasoning
# ---------------------------------------------------------------------------

def document_imputation_decisions(df_original, df_imputed):
    """
    Document all imputation decisions with business justification.
    Produces output/imputation_decisions.json as an auditable record.
    """
    decisions = {
        'shipment_id': {
            'column_type': 'critical_identifier',
            'null_count_before': int(df_original['shipment_id'].isnull().sum())
                                  if 'shipment_id' in df_original else 0,
            'null_count_after': int(df_imputed['shipment_id'].isnull().sum())
                                 if 'shipment_id' in df_imputed else 0,
            'strategy': 'drop_rows',
            'business_reasoning': (
                'shipment_id is the primary tracking key that links scan events, '
                'delay reports, and warehouse transfer records. A row without a '
                'shipment_id cannot be attributed to any operational route and '
                'is untraceable. Imputing an identifier would create phantom '
                'shipments that corrupt route-level delay analysis.'
            ),
            'risk_assessment': 'Low - dropped rows cannot be linked to any shipment'
        },
        'carrier_id': {
            'column_type': 'categorical',
            'null_count_before': int(df_original['carrier_id'].isnull().sum())
                                  if 'carrier_id' in df_original else 0,
            'null_count_after': int(df_imputed['carrier_id'].isnull().sum())
                                 if 'carrier_id' in df_imputed else 0,
            'strategy': 'mode_imputation',
            'value_used': str(df_original['carrier_id'].mode()[0])
                          if 'carrier_id' in df_original else None,
            'business_reasoning': (
                'The most frequent carrier handles the majority of volume on '
                'any given route. Filling with mode preserves the categorical '
                'distribution without distorting carrier scorecard metrics. '
                'Alternative (dropping rows) would remove valid scan records '
                'from delay analysis.'
            ),
            'risk_assessment': (
                'Medium - imputed carrier may not be correct; '
                'affects carrier-level attribution accuracy'
            )
        },
        'delay_minutes': {
            'column_type': 'numerical',
            'null_count_before': int(df_original['delay_minutes'].isnull().sum())
                                  if 'delay_minutes' in df_original else 0,
            'null_count_after': int(df_imputed['delay_minutes'].isnull().sum())
                                 if 'delay_minutes' in df_imputed else 0,
            'strategy': 'median_imputation',
            'value_used': round(float(df_original['delay_minutes'].median()), 2)
                          if 'delay_minutes' in df_original else None,
            'business_reasoning': (
                'Median delay is resistant to high-value outliers such as storm '
                'events or major breakdowns that skew the mean. A shipment with '
                'an unknown delay was most likely experiencing a typical scenario. '
                'Median preserves the distribution shape for route risk scoring '
                'without inflating the average.'
            ),
            'risk_assessment': (
                'Low - median is stable; imputed values are central estimates '
                'and do not introduce extreme values'
            )
        },
        'route_id': {
            'column_type': 'categorical',
            'null_count_before': int(df_original['route_id'].isnull().sum())
                                  if 'route_id' in df_original else 0,
            'null_count_after': int(df_imputed['route_id'].isnull().sum())
                                 if 'route_id' in df_imputed else 0,
            'strategy': 'mode_imputation',
            'value_used': str(df_original['route_id'].mode()[0])
                          if 'route_id' in df_original else None,
            'business_reasoning': (
                'The highest-volume route carries the most shipments and is '
                'statistically the most likely assignment when route data is '
                'missing. This preserves route-level aggregations without '
                'removing scan events from the delay propagation analysis.'
            ),
            'risk_assessment': (
                'Medium - misattributed route distorts per-route delay metrics; '
                'flag imputed rows in downstream reporting'
            )
        },
        'scan_timestamp': {
            'column_type': 'datetime_time_series',
            'null_count_before': int(df_original['scan_timestamp'].isnull().sum())
                                  if 'scan_timestamp' in df_original else 0,
            'null_count_after': int(df_imputed['scan_timestamp'].isnull().sum())
                                 if 'scan_timestamp' in df_imputed else 0,
            'strategy': 'forward_fill',
            'business_reasoning': (
                'Scan timestamps are time-ordered within a route leg. A missing '
                'timestamp means the scan system failed momentarily but the '
                'shipment continued moving. Forward filling the previous '
                'checkpoint time is the safest approximation as it assumes '
                'the shipment passed through in sequential order.'
            ),
            'risk_assessment': (
                'Medium - assumes no time gap; dwell time calculations for '
                'forward-filled rows will be underestimated'
            )
        },
        'trnx_amt': {
            'column_type': 'numerical',
            'null_count_before': int(df_original['trnx_amt'].isnull().sum())
                                  if 'trnx_amt' in df_original else 0,
            'null_count_after': int(df_imputed['trnx_amt'].isnull().sum())
                                 if 'trnx_amt' in df_imputed else 0,
            'strategy': 'median_imputation',
            'value_used': round(float(df_original['trnx_amt'].median()), 2)
                          if 'trnx_amt' in df_original else None,
            'business_reasoning': (
                'Transaction amount is needed for route profitability calculations. '
                'Median transaction value represents a typical shipment and is not '
                'skewed by high-value enterprise orders. Dropping rows with missing '
                'revenue would undercount total route revenue.'
            ),
            'risk_assessment': (
                'Low - median is a conservative estimate; '
                'affects revenue totals by a small margin only'
            )
        }
    }

    os.makedirs('output', exist_ok=True)
    with open('output/imputation_decisions.json', 'w') as f:
        json.dump(decisions, f, indent=2, default=str)

    print("  [OK] Decisions saved -> output/imputation_decisions.json")
    return decisions


# ---------------------------------------------------------------------------
# Task 4 - Compare Before and After Metrics
# ---------------------------------------------------------------------------

def validate_imputation(df_original, df_imputed):
    """Compare null counts and row counts before and after imputation."""
    print("\n" + "=" * 70)
    print("AFTER IMPUTATION - Validation Report")
    print("=" * 70)
    print(f"Total rows before : {len(df_original)}")
    print(f"Total rows after  : {len(df_imputed)}")
    print(f"Rows removed      : {len(df_original) - len(df_imputed)}")
    print(f"\nTotal nulls before: {df_original.isnull().sum().sum()}")
    print(f"Total nulls after : {df_imputed.isnull().sum().sum()}")

    common_cols = [c for c in df_original.columns if c in df_imputed.columns]
    comparison = pd.DataFrame({
        'column': common_cols,
        'null_before': [int(df_original[c].isnull().sum()) for c in common_cols],
        'null_after':  [int(df_imputed[c].isnull().sum()) for c in common_cols],
        'null_pct_after': [
            round(df_imputed[c].isnull().sum() / len(df_imputed) * 100, 2)
            for c in common_cols
        ]
    })

    print("\nNull values by column after imputation:")
    print(comparison.to_string(index=False))
    print("=" * 70)

    return comparison


# ---------------------------------------------------------------------------
# Task 5 - Main Imputation Workflow
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    # Load data
    df = pd.read_csv('data/raw/missing_data.csv')

    # Step 1: Analyze missing before treatment
    print("\nStep 1: Analyzing missing values...")
    analyze_missing_values(df)
    df_original = df.copy()

    # Step 2: Apply strategy-specific imputation
    print("\nStep 2: Applying imputation strategies...")

    print("\n  [Strategy: DROP ROWS] Critical identifiers")
    df = drop_rows_with_nulls(df, ['shipment_id'])

    print("\n  [Strategy: MEDIAN FILL] Numerical columns")
    df = impute_mean_median(df, ['delay_minutes', 'trnx_amt'], strategy='median')

    print("\n  [Strategy: MODE FILL] Categorical columns")
    df = impute_mode(df, ['carrier_id', 'route_id'])

    print("\n  [Strategy: FORWARD FILL] Time-series columns")
    df = impute_forward_fill(df, ['scan_timestamp'])

    # Step 3: Document decisions
    print("\nStep 3: Documenting imputation decisions...")
    document_imputation_decisions(df_original, df)

    # Step 4: Validate results
    print("\nStep 4: Validating imputation...")
    validate_imputation(df_original, df)

    # Step 5: Save cleaned data
    os.makedirs('data/processed', exist_ok=True)
    df.to_csv('data/processed/cleaned_data.csv', index=False)
    print("\n[OK] Cleaned data saved -> data/processed/cleaned_data.csv")
