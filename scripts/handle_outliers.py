import os
import sys
import pandas as pd
import numpy as np
from scipy import stats

# Ensure stdout uses UTF-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def detect_zscore_outliers(df, column_name, threshold=3):
    """
    Task 1: Detect outliers as values beyond +/- 3 standard deviations from mean using scipy.stats.zscore.
    """
    print("\n" + "="*60)
    print(f"TASK 1: Z-SCORE OUTLIER DETECTION ({column_name})")
    print("="*60)
    
    z_score_col = f'{column_name}_zscore'
    df[z_score_col] = np.abs(stats.zscore(df[column_name]))
    z_outliers = df[df[z_score_col] > threshold]
    
    print(f"Z-score threshold: |Z| > {threshold}")
    print(f"Z-score outliers found in {column_name}: {len(z_outliers)}")
    if len(z_outliers) > 0:
        print(z_outliers[['customer_id', column_name, z_score_col]].to_string())
    
    return df, z_outliers


def detect_iqr_outliers(df, column_name, multiplier=1.5):
    """
    Task 2: Detect outliers beyond 1.5 * IQR from quartiles.
    """
    print("\n" + "="*60)
    print(f"TASK 2: IQR OUTLIER DETECTION ({column_name})")
    print("="*60)
    
    Q1 = df[column_name].quantile(0.25)
    Q3 = df[column_name].quantile(0.75)
    IQR = Q3 - Q1
    
    lower = Q1 - multiplier * IQR
    upper = Q3 + multiplier * IQR
    
    iqr_flag_col = f'is_outlier_iqr_{column_name}'
    df[iqr_flag_col] = (df[column_name] < lower) | (df[column_name] > upper)
    
    print(f"Q1 (25th percentile): {Q1}")
    print(f"Q3 (75th percentile): {Q3}")
    print(f"IQR: {IQR}")
    print(f"Lower Bound: {lower}")
    print(f"Upper Bound: {upper}")
    print(f"IQR outliers count in {column_name}: {df[iqr_flag_col].sum()}")
    
    return df, lower, upper


def cap_outliers(df, column_name, lower_bound, upper_bound):
    """
    Task 3: Apply capping strategy - replace extreme values with boundary values.
    """
    print("\n" + "="*60)
    print(f"TASK 3: CAP OUTLIERS AT BOUNDARIES ({column_name})")
    print("="*60)
    
    capped_col = f'{column_name}_capped'
    df[capped_col] = df[column_name].clip(lower=lower_bound, upper=upper_bound)
    
    print(f"Verification of {column_name} capping:")
    print(f"  Before: min={df[column_name].min()}, max={df[column_name].max()}")
    print(f"  After:  min={df[capped_col].min()}, max={df[capped_col].max()}")
    
    return df, capped_col


def flag_outliers_binary(df, column_name):
    """
    Task 4: Mark anomalies with combined binary column without removing data.
    """
    print("\n" + "="*60)
    print(f"TASK 4: FLAG OUTLIERS WITH BINARY COLUMN ({column_name})")
    print("="*60)
    
    z_score_col = f'{column_name}_zscore'
    iqr_flag_col = f'is_outlier_iqr_{column_name}'
    
    is_outlier_col = f'is_outlier_{column_name}'
    df[is_outlier_col] = (df[iqr_flag_col]) | (df[z_score_col] > 3)
    
    normal = df[~df[is_outlier_col]]
    anomalies = df[df[is_outlier_col]]
    
    print(f"Normal records count ({column_name}): {len(normal)}")
    print(f"Anomalies count ({column_name}): {len(anomalies)}")
    
    if len(anomalies) > 0:
        print("\nFlagged Anomalies Sample:")
        print(anomalies[['customer_id', column_name, is_outlier_col]].to_string())
    
    return df, normal, anomalies


def create_cleaning_log(cleaning_log_entries):
    """
    Task 5: Document all outlier-related transformations in a cleaning log.
    """
    print("\n" + "="*60)
    print("TASK 5: CREATE CLEANING LOG")
    print("="*60)
    
    os.makedirs('output', exist_ok=True)
    log_df = pd.DataFrame(cleaning_log_entries)
    
    print("Cleaning Log Entries:")
    print(log_df.to_string())
    
    log_df.to_csv('output/cleaning_log.csv', index=False)
    print("\n✓ Cleaning log saved to output/cleaning_log.csv")
    
    return log_df


if __name__ == "__main__":
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('output', exist_ok=True)
    
    print("\n" + "="*70)
    print("OUTLIER DETECTION & HANDLING PIPELINE")
    print("="*70)
    
    # Load data
    df = pd.read_csv('data/raw/outlier_data.csv')
    print("Initial Data Head:")
    print(df.to_string())
    
    cleaning_log = []
    
    # -------------------------------------------------------------
    # Process 'revenue' Column
    # -------------------------------------------------------------
    df, z_outliers_rev = detect_zscore_outliers(df, 'revenue', threshold=3)
    df, lower_rev, upper_rev = detect_iqr_outliers(df, 'revenue', multiplier=1.5)
    df, revenue_capped_col = cap_outliers(df, 'revenue', lower_rev, upper_rev)
    df, normal_rev, anomalies_rev = flag_outliers_binary(df, 'revenue')
    
    cleaning_log.append({
        'column': 'revenue',
        'method': 'IQR + Z-Score',
        'action': 'cap & flag',
        'threshold_lower': lower_rev,
        'threshold_upper': upper_rev,
        'affected_rows': int(df['is_outlier_revenue'].sum()),
        'date': pd.Timestamp.now()
    })
    
    # -------------------------------------------------------------
    # Process 'age' Column
    # -------------------------------------------------------------
    df, z_outliers_age = detect_zscore_outliers(df, 'age', threshold=3)
    df, lower_age, upper_age = detect_iqr_outliers(df, 'age', multiplier=1.5)
    df, age_capped_col = cap_outliers(df, 'age', lower_age, upper_age)
    df, normal_age, anomalies_age = flag_outliers_binary(df, 'age')
    
    cleaning_log.append({
        'column': 'age',
        'method': 'IQR + Z-Score',
        'action': 'cap & flag',
        'threshold_lower': lower_age,
        'threshold_upper': upper_age,
        'affected_rows': int(df['is_outlier_age'].sum()),
        'date': pd.Timestamp.now()
    })
    
    # Global combined outlier flag across all features
    df['is_outlier'] = df['is_outlier_revenue'] | df['is_outlier_age']
    
    # Task 5: Save cleaning log
    create_cleaning_log(cleaning_log)
    
    # Save processed dataset
    df.to_csv('data/processed/outlier_handled_data.csv', index=False)
    print("\n✓ Outlier handled dataset saved to data/processed/outlier_handled_data.csv")
