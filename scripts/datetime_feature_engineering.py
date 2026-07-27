import os
import sys
import pandas as pd
import numpy as np

# Ensure stdout uses UTF-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def parse_timestamp_strings(df, column_name='transaction_date', date_format='%Y-%m-%d %H:%M:%S'):
    """
    Task 1: Convert string dates to datetime type with explicit format.
    """
    df_parsed = df.copy()
    print("\n" + "="*60)
    print("TASK 1: PARSE TIMESTAMP STRINGS WITH EXPLICIT FORMAT")
    print("="*60)
    print(f"Explicit format string used: '{date_format}'")
    
    df_parsed[column_name] = pd.to_datetime(
        df_parsed[column_name],
        format=date_format
    )
    
    print(f"Column '{column_name}' dtype after parsing: {df_parsed[column_name].dtype}")
    assert 'datetime64' in str(df_parsed[column_name].dtype), "Parsing failed, dtype is not datetime64!"
    print("✓ Successfully verified dtype is datetime64[ns]")
    
    return df_parsed


def extract_day_and_hour(df, column_name='transaction_date'):
    """
    Task 2: Extract Day-of-Week (.dt.day_name()) and Hour-of-Day (.dt.hour).
    """
    df_ext = df.copy()
    print("\n" + "="*60)
    print("TASK 2: EXTRACT DAY-OF-WEEK AND HOUR-OF-DAY")
    print("="*60)
    
    df_ext['day_of_week'] = df_ext[column_name].dt.day_name()
    df_ext['hour'] = df_ext[column_name].dt.hour
    
    print("\nDay of Week Volume Distribution:")
    daily_volume = df_ext['day_of_week'].value_counts()
    print(daily_volume.to_string())
    
    print("\nHourly Volume Distribution:")
    hourly_volume = df_ext.groupby('hour').size()
    print(hourly_volume.to_string())
    
    # Save histogram plot
    os.makedirs('output', exist_ok=True)
    plt.figure(figsize=(8, 4))
    plt.bar(hourly_volume.index, hourly_volume.values, color='skyblue', edgecolor='black')
    plt.title('Hourly Transaction Volume Distribution')
    plt.xlabel('Hour of Day (0-23)')
    plt.ylabel('Transaction Count')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.savefig('output/hourly_distribution.png', bbox_inches='tight')
    plt.close()
    print("✓ Saved histogram plot to output/hourly_distribution.png")
    
    return df_ext


def compute_weekly_metrics(df, column_name='transaction_date'):
    """
    Task 3: Compute Week Number and Resample Data to Weekly Buckets.
    """
    df_week = df.copy()
    print("\n" + "="*60)
    print("TASK 3: COMPUTE WEEK NUMBER AND RESAMPLE DATA")
    print("="*60)
    
    df_week['week_num'] = df_week[column_name].dt.isocalendar().week
    print(f"Unique weeks in dataset: {df_week['week_num'].nunique()} (Weeks: {sorted(df_week['week_num'].unique())})")
    
    # Resample for weekly metrics
    df_ts = df_week.set_index(column_name)
    weekly_metrics = df_ts['amount'].resample('W-SUN').agg(['sum', 'count', 'mean'])
    weekly_metrics.columns = ['weekly_revenue', 'transaction_count', 'avg_transaction_amount']
    
    print("\nWeekly Resampled Metrics:")
    print(weekly_metrics.to_string())
    
    weekly_metrics.to_csv('output/weekly_revenue_resampled.csv')
    print("✓ Saved weekly metrics to output/weekly_revenue_resampled.csv")
    
    # Save weekly trend plot
    plt.figure(figsize=(8, 4))
    plt.plot(weekly_metrics.index.strftime('%Y-%m-%d'), weekly_metrics['weekly_revenue'], marker='o', color='purple', linewidth=2)
    plt.title('Weekly Revenue Trend')
    plt.xlabel('Week Ending Date')
    plt.ylabel('Revenue ($)')
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.savefig('output/weekly_trend.png', bbox_inches='tight')
    plt.close()
    print("✓ Saved trend plot to output/weekly_trend.png")
    
    return df_week, weekly_metrics


def compute_customer_recency(df, customer_col='customer_id', date_col='transaction_date'):
    """
    Task 4: Compute Days-Since-Event Metric for Churn Analysis.
    """
    df_recency = df.copy()
    print("\n" + "="*60)
    print("TASK 4: COMPUTE DAYS-SINCE-EVENT METRIC")
    print("="*60)
    
    # Use max dataset timestamp + 1 day as baseline reference point
    reference_today = df_recency[date_col].max() + pd.Timedelta(days=1)
    print(f"Reference Date for Recency Calculation: {reference_today}")
    
    # Compute last purchase date per customer
    customer_last_purchase = df_recency.groupby(customer_col)[date_col].transform('max')
    df_recency['days_since_last_purchase'] = (reference_today - customer_last_purchase).dt.days
    
    # Customer-level recency summary
    recency_by_customer = df_recency.groupby(customer_col)['days_since_last_purchase'].min()
    
    print("\nRecency Distribution Summary (Days since last purchase per customer):")
    print(recency_by_customer.describe().to_string())
    
    print("\nCustomer Recency Breakdown:")
    for cust_id, days in recency_by_customer.items():
        status = "Active" if days <= 7 else "At-Risk / Inactive"
        print(f"  {cust_id}: {days} days ago ({status})")
    
    return df_recency


def build_time_indexed_aggregations(df):
    """
    Task 5: Build Time-Indexed Aggregation (Day x Hour pivot table).
    """
    print("\n" + "="*60)
    print("TASK 5: BUILD TIME-INDEXED AGGREGATION")
    print("="*60)
    
    # Multi-level groupby
    hourly_daily = df.groupby(['day_of_week', 'hour']).agg({
        'amount': ['sum', 'count', 'mean']
    })
    print("Multi-level Groupby (Day of Week x Hour) Sample:")
    print(hourly_daily.head(10).to_string())
    
    # Pivot table
    pivot_table = pd.pivot_table(
        df,
        values='amount',
        index='hour',
        columns='day_of_week',
        aggfunc='sum',
        fill_value=0
    )
    
    print("\nHour x Day-of-Week Pivot Table (Total Amount):")
    print(pivot_table.to_string())
    
    pivot_table.to_csv('output/day_hour_pivot_table.csv')
    print("✓ Saved pivot table to output/day_hour_pivot_table.csv")
    
    # Identify Peak Activity Window
    peak_hour = pivot_table.sum(axis=1).idxmax()
    peak_day = pivot_table.sum(axis=0).idxmax()
    peak_val = pivot_table.values.max()
    print(f"\nPeak Activity Insights:")
    print(f"  Busiest Hour of Day: {peak_hour}:00 with total revenue ${pivot_table.sum(axis=1).max():.2f}")
    print(f"  Busiest Day of Week: {peak_day} with total revenue ${pivot_table.sum(axis=0).max():.2f}")
    print(f"  Highest Single Window: {peak_day} at {pivot_table.loc[:, peak_day].idxmax()}:00 (${peak_val:.2f})")
    
    # Save Heatmap Plot
    plt.figure(figsize=(10, 6))
    plt.imshow(pivot_table.values, cmap='YlOrRd', aspect='auto')
    plt.colorbar(label='Total Revenue ($)')
    plt.yticks(range(len(pivot_table.index)), pivot_table.index)
    plt.xticks(range(len(pivot_table.columns)), pivot_table.columns, rotation=45)
    plt.title('Hour x Day-of-Week Revenue Heatmap')
    plt.xlabel('Day of Week')
    plt.ylabel('Hour of Day')
    plt.tight_layout()
    plt.savefig('output/pivot_heatmap.png', bbox_inches='tight')
    plt.close()
    print("✓ Saved pivot heatmap plot to output/pivot_heatmap.png")
    
    return pivot_table


def test_edge_case_formats():
    """
    Test datetime parsing edge cases and timezone formats.
    """
    print("\n" + "="*60)
    print("EDGE CASE & TIMEZONE FORMAT TESTING")
    print("="*60)
    
    test_dates = [
        ('2025-01-15 14:30:45', '%Y-%m-%d %H:%M:%S'),         # Standard
        ('2025-1-15 14:30:45', '%Y-%m-%d %H:%M:%S'),          # Single-digit month
        ('15/01/2025 14:30:45', '%d/%m/%Y %H:%M:%S'),         # European format
        ('2025-01-15T14:30:45Z', '%Y-%m-%dT%H:%M:%SZ'),       # ISO format with Z
    ]
    
    for date_str, expected_fmt in test_dates:
        try:
            parsed = pd.to_datetime(date_str, format=expected_fmt)
            print(f"✓ {date_str} → Parsed successfully: {parsed}")
        except Exception as e:
            print(f"✗ {date_str} - format mismatch ({e})")


if __name__ == "__main__":
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('output', exist_ok=True)
    
    print("\n" + "="*70)
    print("DATETIME FEATURE ENGINEERING PIPELINE")
    print("="*70)
    
    # Load raw data
    df = pd.read_csv('data/raw/datetime_transaction_data.csv')
    print("Initial Data Head:")
    print(df.head(5).to_string())
    
    # Task 1: Parse timestamps with explicit format
    df = parse_timestamp_strings(df, column_name='transaction_date', date_format='%Y-%m-%d %H:%M:%S')
    
    # Task 2: Extract day of week and hour of day
    df = extract_day_and_hour(df, column_name='transaction_date')
    
    # Task 3: Compute week number and resample data
    df, weekly_resampled = compute_weekly_metrics(df, column_name='transaction_date')
    
    # Task 4: Compute days-since-event metric
    df = compute_customer_recency(df, customer_col='customer_id', date_col='transaction_date')
    
    # Task 5: Build time-indexed aggregations
    pivot_res = build_time_indexed_aggregations(df)
    
    # Edge case testing
    test_edge_case_formats()
    
    # Verification checks
    print("\n" + "="*60)
    print("PIPELINE TESTING & VERIFICATION SUMMARY")
    print("="*60)
    print(f"Min date: {df['transaction_date'].min()}")
    print(f"Max date: {df['transaction_date'].max()}")
    print(f"Days in dataset: {(df['transaction_date'].max() - df['transaction_date'].min()).days}")
    print(f"Hours with data: {sorted(df['hour'].unique())}")
    print(f"Weeks in dataset: {df['week_num'].nunique()}")
    print(f"Min days since purchase: {df['days_since_last_purchase'].min()}")
    print(f"Max days since purchase: {df['days_since_last_purchase'].max()}")
    print("="*60)
    
    # Save processed features dataframe
    df.to_csv('data/processed/processed_datetime_features.csv', index=False)
    print("\n✓ Processed datetime features dataset saved to data/processed/processed_datetime_features.csv")
