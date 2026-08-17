import pandas as pd
from sqlalchemy import create_engine

# Note: Adjust the connection string as needed. Assuming a generic postgres connection for the assignment.
engine = create_engine('postgresql://user:password@localhost:5432/ecommerce')

def load_query(query_name):
    """Load SQL query from file."""
    with open(f'queries/{query_name}.sql', 'r') as f:
        return f.read()

def validate_metrics(mau_df, revenue_df, funnel_df):
    """Validate metric computation."""
    # Check for nulls
    assert mau_df.isnull().sum().sum() == 0, "MAU has nulls"
    assert revenue_df.isnull().sum().sum() == 0, "Revenue has nulls"
    
    # Check value ranges
    assert (revenue_df['monthly_revenue'] > 0).all(), "Revenue <= 0"
    assert (funnel_df['conversion_pct'] >= 0).all() and (funnel_df['conversion_pct'] <= 100).all(), "Conversion out of range"
    
    # Check consistency
    for idx, row in revenue_df.iterrows():
        assert row['order_count'] > 0, "Zero orders"
        assert row['monthly_revenue'] > 0, "Zero revenue"
        
    print("✓ All metrics validated")
    return True

if __name__ == "__main__":
    try:
        # Load and execute
        mau_query = load_query('monthly_active_users')
        mau = pd.read_sql(mau_query, engine)
        print("Monthly Active Users:")
        print(mau)

        revenue_query = load_query('revenue_by_segment')
        revenue = pd.read_sql(revenue_query, engine)
        print("\nRevenue by Segment:")
        print(revenue)

        funnel_query = load_query('conversion_funnel')
        funnel = pd.read_sql(funnel_query, engine)
        print("\nConversion Funnel:")
        print(funnel)

        # Validate
        validate_metrics(mau, revenue, funnel)
    except Exception as e:
        print(f"Failed to execute queries or validate: {e}")
