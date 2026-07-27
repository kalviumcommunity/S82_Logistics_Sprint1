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


def validate_range_checks(df):
    """
    Task 1: Range Checks on age, price, and birth_date.
    """
    print("\n" + "="*60)
    print("TASK 1: RANGE CHECKS")
    print("="*60)
    
    df_val = df.copy()
    df_val['valid_age'] = (df_val['age'] >= 0) & (df_val['age'] <= 150)
    df_val['valid_price'] = df_val['price'] >= 0
    
    birth_dt = pd.to_datetime(df_val['birth_date'], errors='coerce')
    df_val['valid_date'] = (birth_dt >= pd.Timestamp('1920-01-01')) & (birth_dt <= pd.Timestamp.now())
    
    print(f"Invalid ages (outside 0-150): {(~df_val['valid_age']).sum()}")
    print(f"Invalid prices (< 0):          {(~df_val['valid_price']).sum()}")
    print(f"Invalid birth dates (future or < 1920): {(~df_val['valid_date']).sum()}")
    
    return df_val


def validate_null_constraints(df):
    """
    Task 2: Null Constraints on customer_id and email.
    """
    print("\n" + "="*60)
    print("TASK 2: NULL CONSTRAINTS")
    print("="*60)
    
    df_val = df.copy()
    df_val['valid_customer_id'] = df_val['customer_id'].notna()
    df_val['valid_email'] = df_val['email'].notna()
    
    print(f"Missing customer IDs: {(~df_val['valid_customer_id']).sum()}")
    print(f"Missing emails:       {(~df_val['valid_email']).sum()}")
    
    return df_val


def validate_format_patterns(df):
    """
    Task 3: Format Pattern Validation for email and phone numbers.
    """
    print("\n" + "="*60)
    print("TASK 3: FORMAT PATTERN VALIDATION")
    print("="*60)
    
    df_val = df.copy()
    df_val['valid_email_format'] = df_val['email'].str.contains('@', na=False)
    df_val['valid_phone'] = df_val['phone'].astype(str).str.match(r'^\d{10}$', na=False)
    
    print(f"Invalid email formats (missing '@'): {(~df_val['valid_email_format']).sum()}")
    print(f"Invalid phone numbers (not 10 digits): {(~df_val['valid_phone']).sum()}")
    
    return df_val


def validate_business_rules(df):
    """
    Task 4: Business Rule Validation (end_date >= start_date).
    """
    print("\n" + "="*60)
    print("TASK 4: BUSINESS RULE VALIDATION")
    print("="*60)
    
    df_val = df.copy()
    start_dt = pd.to_datetime(df_val['start_date'], errors='coerce')
    end_dt = pd.to_datetime(df_val['end_date'], errors='coerce')
    
    df_val['valid_date_order'] = end_dt >= start_dt
    
    print(f"Invalid date ranges (end_date < start_date): {(~df_val['valid_date_order']).sum()}")
    
    return df_val


def generate_validation_report(df):
    """
    Task 5: Validation Report & Failure Isolation.
    """
    print("\n" + "="*60)
    print("TASK 5: VALIDATION REPORT & FAILURE ISOLATION")
    print("="*60)
    
    os.makedirs('output', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    
    validation_cols = [
        'valid_age', 'valid_price', 'valid_date',
        'valid_customer_id', 'valid_email', 'valid_email_format',
        'valid_phone', 'valid_date_order'
    ]
    
    df['passes_all_checks'] = df[validation_cols].all(axis=1)
    
    # Isolate failures
    failures = df[~df['passes_all_checks']]
    failures.to_csv('output/validation_failures.csv', index=False)
    print("✓ Saved failure records to output/validation_failures.csv")
    
    # Summary Metrics
    total_records = len(df)
    passed_records = int(df['passes_all_checks'].sum())
    failed_records = total_records - passed_records
    pass_rate = round((passed_records / total_records) * 100, 2)
    
    print("\n" + "="*70)
    print("DATA VALIDATION SUMMARY REPORT")
    print("="*70)
    print(f"Total Records Evaluated: {total_records}")
    print(f"Passed All Checks:       {passed_records} ({pass_rate}%)")
    print(f"Failed Validation:       {failed_records} ({round(100 - pass_rate, 2)}%)")
    print("="*70)
    
    # Detail failure breakdown per check
    failure_breakdown = {}
    print("\nCheck Failure Breakdown:")
    for check in validation_cols:
        failed_count = int((~df[check]).sum())
        failure_breakdown[check] = failed_count
        print(f"  - {check:<20}: {failed_count} failures")
    
    report_summary = {
        'total_records': total_records,
        'passed_records': passed_records,
        'failed_records': failed_records,
        'pass_rate_pct': pass_rate,
        'check_failure_breakdown': failure_breakdown,
        'timestamp': pd.Timestamp.now().isoformat()
    }
    
    with open('output/validation_summary_report.json', 'w') as f:
        json.dump(report_summary, f, indent=2)
    print("\n✓ Validation summary report saved to output/validation_summary_report.json")
    
    df_clean = df[df['passes_all_checks']].copy()
    df_clean.to_csv('data/processed/validated_data.csv', index=False)
    print("✓ Valid dataset saved to data/processed/validated_data.csv")
    
    return df_clean, failures, report_summary


if __name__ == "__main__":
    print("\n" + "="*70)
    print("DATA VALIDATION PIPELINE EXECUTION")
    print("="*70)
    
    # Load raw data
    df = pd.read_csv('data/raw/validation_data.csv')
    print("Initial Raw Dataset Head:")
    print(df.to_string())
    
    # Run validation rules
    df = validate_range_checks(df)
    df = validate_null_constraints(df)
    df = validate_format_patterns(df)
    df = validate_business_rules(df)
    
    # Generate report and isolate failures
    df_clean, failures, summary = generate_validation_report(df)
