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


def perform_explicit_join(df_customers, df_orders):
    """
    Task 1: Explicit Join with Row Count Validation.
    """
    print("\n" + "="*60)
    print("TASK 1: EXPLICIT JOIN WITH ROW COUNT VALIDATION")
    print("="*60)
    
    print(f"Left table (customers) row count: {len(df_customers):,}")
    print(f"Right table (orders) row count:   {len(df_orders):,}")
    
    df_merged = pd.merge(df_customers, df_orders, on='customer_id', how='left')
    
    print(f"Merged (Left Join) row count:     {len(df_merged):,}")
    print(f"Row count change (Merged - Left): {len(df_merged) - len(df_customers):,}")
    
    return df_merged


def detect_unmatched_keys(df_customers, df_orders):
    """
    Task 2: Detect Unmatched Keys and Orphaned Records.
    """
    print("\n" + "="*60)
    print("TASK 2: DETECT UNMATCHED KEYS")
    print("="*60)
    
    os.makedirs('output', exist_ok=True)
    
    unmatched_customers = df_customers[~df_customers['customer_id'].isin(df_orders['customer_id'])]
    unmatched_orders = df_orders[~df_orders['customer_id'].isin(df_customers['customer_id'])]
    
    print(f"Customers without orders (Unmatched Left):  {len(unmatched_customers):,}")
    print(f"Orphaned orders (Unmatched Right):          {len(unmatched_orders):,}")
    
    unmatched_customers.to_csv('output/unmatched_customers.csv', index=False)
    unmatched_orders.to_csv('output/unmatched_orders.csv', index=False)
    
    print("✓ Saved unmatched customers to output/unmatched_customers.csv")
    print("✓ Saved orphaned orders to output/unmatched_orders.csv")
    
    return unmatched_customers, unmatched_orders


def compare_join_types(df_customers, df_orders):
    """
    Task 3: Compare Join Types (Inner vs Left vs Outer).
    """
    print("\n" + "="*60)
    print("TASK 3: COMPARE JOIN TYPES")
    print("="*60)
    
    inner = pd.merge(df_customers, df_orders, on='customer_id', how='inner')
    left = pd.merge(df_customers, df_orders, on='customer_id', how='left')
    outer = pd.merge(df_customers, df_orders, on='customer_id', how='outer')
    
    print(f"Inner Join rows: {len(inner):,}")
    print(f"Left Join rows:  {len(left):,}")
    print(f"Outer Join rows: {len(outer):,}")
    
    return inner, left, outer


def validate_duplication(df_merged):
    """
    Task 4: Validate No Unexpected Duplication.
    """
    print("\n" + "="*60)
    print("TASK 4: VALIDATE NO UNEXPECTED DUPLICATION")
    print("="*60)
    
    print(f"Merged Dataframe Columns:\n  {list(df_merged.columns)}")
    
    key_counts = df_merged['customer_id'].value_counts()
    print(f"Max orders/records per customer: {key_counts.max()}")
    print(f"Min orders/records per customer: {key_counts.min()}")
    print(f"Average orders per customer:     {key_counts.mean():.2f}")


def document_join_decision(df_customers, df_orders, df_merged, unmatched_customers, unmatched_orders):
    """
    Task 5: Document Join Decision in structured JSON report.
    """
    print("\n" + "="*60)
    print("TASK 5: DOCUMENT JOIN DECISION")
    print("="*60)
    
    os.makedirs('output', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    
    join_report = {
        'join_type': 'left',
        'left_table': 'customers',
        'right_table': 'orders',
        'join_key': 'customer_id',
        'left_rows': len(df_customers),
        'right_rows': len(df_orders),
        'result_rows': len(df_merged),
        'unmatched_left': len(unmatched_customers),
        'unmatched_right': len(unmatched_orders),
        'reasoning': 'Left join preserves all customers; unmatched customers have no orders while preserving 1:N order relationship without dropping zero-order customer records.'
    }
    
    print(json.dumps(join_report, indent=2))
    
    with open('output/join_report.json', 'w') as f:
        json.dump(join_report, f, indent=2)
    print("\n✓ Join report saved to output/join_report.json")
    
    df_merged.to_csv('data/processed/merged_customer_orders.csv', index=False)
    print("✓ Merged dataset saved to data/processed/merged_customer_orders.csv")
    
    return join_report


if __name__ == "__main__":
    print("\n" + "="*70)
    print("TABLE JOIN & KEY VALIDATION PIPELINE")
    print("="*70)
    
    # Load raw datasets
    df_customers = pd.read_csv('data/raw/customers.csv')
    df_orders = pd.read_csv('data/raw/orders.csv')
    
    # Task 1: Explicit Join
    df_merged = perform_explicit_join(df_customers, df_orders)
    
    # Task 2: Detect Unmatched Keys
    unmatched_cust, unmatched_ord = detect_unmatched_keys(df_customers, df_orders)
    
    # Task 3: Compare Join Types
    inner, left, outer = compare_join_types(df_customers, df_orders)
    
    # Task 4: Validate Duplication
    validate_duplication(df_merged)
    
    # Task 5: Document Join Decision
    report = document_join_decision(df_customers, df_orders, df_merged, unmatched_cust, unmatched_ord)
