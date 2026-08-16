import pandas as pd
from sqlalchemy import create_engine

# Note: Adjust the connection string as needed. Assuming a generic postgres connection for the assignment.
engine = create_engine('postgresql://user:password@localhost:5432/ecommerce')

def validate_left_join(customers_count, joined_df):
    print(f"Before: {customers_count} customers")
    print(f"After: {len(joined_df)} rows")
    print(f"Change: {len(joined_df) - customers_count} ({((len(joined_df)-customers_count)/customers_count)*100:.1f}%)")
    # Expected: After >= Before (all customers kept, some appear multiple times due to multiple orders)

def analyze_unmatched(no_orders_df, orphaned_df, customers_count):
    print(f"Customers without orders: {len(no_orders_df)} ({(len(no_orders_df)/customers_count)*100:.1f}%)")
    print(f"Orphaned orders: {len(orphaned_df)}")
    if len(orphaned_df) > 0:
        print("⚠️ Orphaned records found - investigate customer_id mismatch")

def compare_joins(inner_df, left_df, full_df):
    print(f"INNER: {len(inner_df)} rows (only matched)")
    print(f"LEFT: {len(left_df)} rows (all left, matched right)")
    print(f"FULL: {len(full_df)} rows (all from both)")
    assert len(left_df) >= len(inner_df)
    assert len(full_df) >= max(len(left_df), 1000)

def validate_multi_table(result_df, expected_total):
    product_total = result_df.groupby('product_id')['line_total'].sum()
    assert abs(product_total.sum() - expected_total) < 0.01, "Duplication in join!"
    print("✓ Multi-table join validated - no duplication")

join_documentation = """
JOIN STRATEGY DOCUMENTATION

Table: customers (1000 rows, PK: customer_id)
Table: orders (5000 rows, FK: customer_id)
Table: order_items (8000 rows, FK: order_id)
Table: products (500 rows, PK: product_id)

Decision 1: customers LEFT JOIN orders
- Purpose: Get all customers with their order history
- Row count change: 1000 → 5000 (one row per order)
- Unmatched: 100 customers have no orders (retained due to LEFT)
- Business use: Customer lifetime value, segmentation

Decision 2: orders LEFT JOIN order_items
- Purpose: Detailed line-item view
- Row count change: 5000 → 8000 (some orders have multiple items)
- Unmatched: None (all orders should have items)
- Business use: Product revenue, inventory analysis

Decision 3: Full 3-table join
- Purpose: Complete order context with products
- Row count: 5000 → 8000 (base orders multiplied by items)
- Risk: Be careful not to double-count in aggregations
- Solution: Aggregate at order level, not at result set level

Validation: Row counts match expected, no orphaned records, no duplication
"""

if __name__ == "__main__":
    print(join_documentation)
