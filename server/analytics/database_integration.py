import pandas as pd
from sqlalchemy import create_engine, inspect
from datetime import date

def generate_mock_data():
    """Generate mock cleaned data matching the assignment requirements."""
    data = {
        'customer_id': [1, 2, 3, 4, 5],
        'email': ['alice@enterprise.com', 'bob@startup.io', 'charlie@enterprise.com', 'diana@corp.net', 'eve@smb.com'],
        'signup_date': [date(2023, 1, 15), date(2023, 3, 22), date(2023, 6, 10), date(2023, 8, 5), date(2023, 11, 30)],
        'customer_type': ['Enterprise', 'Startup', 'Enterprise', 'Corporate', 'SMB'],
        'lifetime_value': [50000.0, 1500.0, 75000.0, 12000.0, 800.0]
    }
    return pd.DataFrame(data)

def load_cleaned_data_to_database(df, table_name, database_path='analytics.db'):
    """Load cleaned DataFrame to database - repeatable function."""
    # Task 1 & 5: Setup Database Connection
    engine = create_engine(f'sqlite:///{database_path}')
    
    # Test connection
    with engine.connect() as conn:
        print("✓ Database connection successful")
    
    # Task 2 & 5: Load Cleaned DataFrame as Table
    df.to_sql(table_name, engine, if_exists='replace', index=False)
    
    # Verify table created
    print("Tables in database:", inspect(engine).get_table_names())
    
    # Validate rows loaded
    count = pd.read_sql(f"SELECT COUNT(*) as ct FROM {table_name}", engine)
    rows_loaded = count.iloc[0]['ct']
    print(f"✓ Loaded {rows_loaded} rows to {table_name}")
    
    return engine

def validate_schema(engine, table_name):
    """Validate the schema of the loaded table."""
    # Task 3: Validate Schema
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    
    print("\nTABLE SCHEMA:")
    for col in columns:
        print(f"  {col['name']:20} {str(col['type']):15} {'NOT NULL' if col['nullable']==False else ''}")
    
    print("\nDATATYPE VALIDATION:")
    expected_types = {
        'customer_id': 'INTEGER',
        'email': 'VARCHAR',
        'signup_date': 'DATE'
    }
    
    for col_name, expected_type in expected_types.items():
        actual = [c['type'] for c in columns if c['name'] == col_name][0]
        status = '✓' if expected_type in str(actual) else '✗'
        print(f"{status} {col_name}: {actual}")

def run_queries(engine):
    """Run required queries on the database."""
    # Task 4: Query and Return Results
    
    print("\n--- Basic Query ---")
    query = "SELECT * FROM customers_cleaned WHERE customer_type = 'Enterprise'"
    results = pd.read_sql(query, engine)
    print(f"Retrieved {len(results)} rows")
    print(results.head())
    
    print("\n--- Aggregation Query ---")
    query_agg = """
    SELECT 
        customer_type,
        COUNT(*) as count,
        AVG(lifetime_value) as avg_ltv
    FROM customers_cleaned
    GROUP BY customer_type
    ORDER BY avg_ltv DESC
    """
    summary = pd.read_sql(query_agg, engine)
    print("Summary by segment:")
    print(summary)

def main():
    # Generate data
    df_clean = generate_mock_data()
    
    table_name = 'customers_cleaned'
    
    # Load and validate
    engine = load_cleaned_data_to_database(df_clean, table_name)
    
    # Validate Schema
    validate_schema(engine, table_name)
    
    # Run queries
    run_queries(engine)
    
    # Note on Domain Guidance:
    # While the assignment requires tracking 'customers_cleaned', this foundational SQLite setup 
    # directly transfers to our logistics requirements:
    # Instead of 'customers_cleaned', we will load 'shipment_scans', 'delay_reports', and 'warehouse_transfers'.
    # This SQL pipeline will enable us to join these datasets to predict cascading delivery delays.

if __name__ == "__main__":
    main()
