import pandas as pd
import numpy as np
import json
import os


def profile_nulls_and_duplicates(df):
    """
    Compute null percentage and duplicate counts per column.
    Returns: Dictionary with null analysis by column
    """
    profile = {
        'null_counts': {},
        'null_percentages': {},
        'exact_duplicate_count': 0,
        'duplicate_percentage': 0.0
    }

    for col in df.columns:
        null_count = df[col].isna().sum()
        null_pct = (null_count / len(df)) * 100
        profile['null_counts'][col] = int(null_count)
        profile['null_percentages'][col] = round(null_pct, 2)

    dup_count = df.duplicated().sum()
    profile['exact_duplicate_count'] = int(dup_count)
    profile['duplicate_percentage'] = round((dup_count / len(df)) * 100, 2)

    return profile


def profile_numerical_columns(df):
    """
    Summarise numerical columns with statistical measures.
    Returns: DataFrame with min, max, mean, median, std
    """
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    stats = {}

    for col in numerical_cols:
        col_data = df[col].dropna()
        stats[col] = {
            'min': round(float(col_data.min()), 2) if len(col_data) > 0 else None,
            'max': round(float(col_data.max()), 2) if len(col_data) > 0 else None,
            'mean': round(float(col_data.mean()), 2) if len(col_data) > 0 else None,
            'median': round(float(col_data.median()), 2) if len(col_data) > 0 else None,
            'std': round(float(col_data.std()), 2) if len(col_data) > 1 else None,
            'null_count': int(df[col].isnull().sum()),
            'negative_count': int((df[col] < 0).sum())
        }

    return pd.DataFrame(stats).T


def profile_categorical_columns(df, top_n=5):
    """
    Summarise categorical columns with value distributions including
    frequency counts AND percentage breakdowns for clear quality assessment.
    Returns: Dictionary with unique counts, null rates, and top value distributions
    """
    categorical_cols = df.select_dtypes(include=['object']).columns
    profile = {}

    for col in categorical_cols:
        total = len(df)
        value_counts = df[col].value_counts(dropna=True)
        null_count = int(df[col].isnull().sum())

        # Build frequency distribution with count AND percentage per value
        frequency_distribution = {}
        for val, cnt in value_counts.head(top_n).items():
            frequency_distribution[str(val)] = {
                'count': int(cnt),
                'percentage': round((int(cnt) / total) * 100, 2)
            }

        profile[col] = {
            'unique_count': int(df[col].nunique()),
            'null_count': null_count,
            'null_percentage': round((null_count / total) * 100, 2),
            'top_values': value_counts.head(top_n).to_dict(),
            'top_value_percentages': {
                str(val): round((int(cnt) / total) * 100, 2)
                for val, cnt in value_counts.head(top_n).items()
            },
            'value_frequency_distribution': frequency_distribution
        }

    return profile


def identify_quality_issues(df, null_threshold=30, duplicate_threshold=5):
    """
    Identify data quality problems based on thresholds.
    Returns: List of issues found with severity and recommendations
    """
    issues = []

    # --- Check 1: High null percentages per column ---
    null_pcts = (df.isnull().sum() / len(df)) * 100
    for col, pct in null_pcts.items():
        if pct > null_threshold:
            issues.append({
                'type': 'High nulls',
                'column': col,
                'severity': 'HIGH',
                'value': f"{pct:.1f}% missing",
                'recommendation': 'Consider imputation or column exclusion'
            })

    # --- Check 2: High duplicate row rate ---
    dup_count = df.duplicated().sum()
    dup_pct = (dup_count / len(df)) * 100
    if dup_pct > duplicate_threshold:
        issues.append({
            'type': 'High duplicates',
            'column': 'Full row',
            'severity': 'HIGH',
            'value': f"{dup_pct:.1f}% duplicated ({int(dup_count)} rows)",
            'recommendation': 'Deduplication required before analysis'
        })

    # --- Check 3: Negative values in amount/revenue columns ---
    for col in df.select_dtypes(include=[np.number]).columns:
        neg_count = int((df[col] < 0).sum())
        if neg_count > 0 and 'amount' in col.lower():
            issues.append({
                'type': 'Invalid range',
                'column': col,
                'severity': 'MEDIUM',
                'value': f"{neg_count} negative value(s) found",
                'recommendation': 'Investigate negative entries; likely data entry errors or refunds'
            })

    # --- Check 4: Columns that are entirely null ---
    for col in df.columns:
        if df[col].isnull().all():
            issues.append({
                'type': 'Empty column',
                'column': col,
                'severity': 'HIGH',
                'value': '100.0% missing - column is entirely empty',
                'recommendation': 'Drop column or investigate data source pipeline'
            })

    # --- Check 5: Columns with only one unique non-null value (zero variance) ---
    for col in df.select_dtypes(include=[np.number]).columns:
        if df[col].nunique() == 1 and df[col].notnull().any():
            issues.append({
                'type': 'Zero variance',
                'column': col,
                'severity': 'LOW',
                'value': f"Only one unique value: {df[col].dropna().iloc[0]}",
                'recommendation': 'Column carries no information; consider dropping'
            })

    return issues


def generate_profile_report(df, filepath):
    """
    Generate complete data quality report and save to JSON.
    Returns: Complete profile report dictionary
    """
    nulls_dups = profile_nulls_and_duplicates(df)
    num_stats = profile_numerical_columns(df)
    cat_stats = profile_categorical_columns(df)
    issues = identify_quality_issues(df)

    report = {
        'dataset': filepath,
        'record_count': len(df),
        'column_count': len(df.columns),
        'columns': list(df.columns),
        'nulls_and_duplicates': nulls_dups,
        'numerical_stats': num_stats.to_dict(),
        'categorical_stats': cat_stats,
        'quality_issues': issues,
        'quality_summary': {
            'total_issues': len(issues),
            'high_severity': sum(1 for i in issues if i['severity'] == 'HIGH'),
            'medium_severity': sum(1 for i in issues if i['severity'] == 'MEDIUM'),
            'low_severity': sum(1 for i in issues if i['severity'] == 'LOW')
        }
    }

    # Create output directory if it does not exist
    os.makedirs('output', exist_ok=True)

    # Save report
    with open('output/profile_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)

    # Print summary
    print(f"\n{'='*60}")
    print(f"DATA QUALITY PROFILE: {filepath}")
    print(f"{'='*60}")
    print(f"Records : {report['record_count']}")
    print(f"Columns : {report['column_count']}")
    print(f"Exact duplicates : {nulls_dups['exact_duplicate_count']} "
          f"({nulls_dups['duplicate_percentage']}%)")

    print(f"\n--- Null Percentages ---")
    for col, pct in nulls_dups['null_percentages'].items():
        bar = '#' * int(pct // 5)
        flag = ' <-- HIGH' if pct > 30 else ''
        print(f"  {col:<20} {pct:>6.1f}%  {bar}{flag}")

    print(f"\n--- Numerical Stats ---")
    for col in num_stats.index:
        row = num_stats.loc[col]
        print(f"  {col:<20} min={row['min']}  max={row['max']}  "
              f"mean={row['mean']}  median={row['median']}  std={row['std']}")

    print(f"\n--- Categorical Value Distributions ---")
    for col, info in cat_stats.items():
        print(f"  {col} ({info['unique_count']} unique, "
              f"{info['null_percentage']}% null):")
        for val, data in info['value_frequency_distribution'].items():
            bar = '#' * int(data['percentage'] // 5)
            print(f"    {str(val):<15} {data['count']:>3} ({data['percentage']:>5.1f}%)  {bar}")

    print(f"\n--- Quality Issues ({len(issues)} found) ---")
    for issue in issues:
        print(f"  [{issue['severity']}] {issue['type']} in '{issue['column']}'")
        print(f"    Value: {issue['value']}")
        print(f"    Fix  : {issue['recommendation']}")

    print(f"\nSummary: {report['quality_summary']}")
    print(f"Report saved -> output/profile_report.json")
    print(f"{'='*60}\n")

    return report


if __name__ == '__main__':
    df = pd.read_csv('data/raw/quality_test.csv')
    generate_profile_report(df, 'data/raw/quality_test.csv')
