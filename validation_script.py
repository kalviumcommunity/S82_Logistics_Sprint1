import pandas as pd
import sqlite3
from datetime import datetime, timedelta

# Mock Database Setup (Logistics Domain)
engine = sqlite3.connect(':memory:')
engine.execute('CREATE TABLE shipment_scans (scan_id INTEGER, route_id INTEGER, scan_date TEXT, delay_minutes INTEGER)')

# Insert Mock Data
mock_data = [
    # Route 1: Active in Dec, dormant in Jan
    (1, 1, '2023-12-15', 50),
    (2, 1, '2023-12-28', 10),
    # Route 2: Active in both months
    (3, 2, '2023-12-10', 0),
    (4, 2, '2024-01-05', 120),
    # Route 3: Active in Jan only
    (5, 3, '2024-01-10', 15),
    (6, 3, '2024-01-15', 30)
]
engine.executemany('INSERT INTO shipment_scans VALUES (?, ?, ?, ?)', mock_data)

# Fetch data for Python calculations
scans_df = pd.read_sql("SELECT * FROM shipment_scans", engine)
scans_df['scan_date'] = pd.to_datetime(scans_df['scan_date'])

def validate_metrics(engine, scans_df, tolerance_pct=0.1):
    """
    Validate that SQL and Python compute identical metrics.
    """
    metrics = {
        'active_routes_30d': {
            'sql': """
                SELECT COUNT(DISTINCT route_id) 
                FROM shipment_scans 
                WHERE scan_date >= date('2024-01-15', '-30 day')
            """,
            'python': lambda: scans_df[
                scans_df['scan_date'] >= (pd.to_datetime('2024-01-15') - timedelta(days=30))
            ]['route_id'].nunique(),
            'tolerance': 0
        },
        'average_delay_minutes': {
            'sql': "SELECT AVG(delay_minutes) FROM shipment_scans",
            'python': lambda: scans_df['delay_minutes'].mean(),
            'tolerance': 0.1
        },
        'dormant_routes': {
            # Intentional Discrepancy: SQL uses strftime('%m') which strips year context!
            'sql': """
                SELECT COUNT(DISTINCT c1.route_id) 
                FROM (
                    SELECT DISTINCT route_id FROM shipment_scans 
                    WHERE strftime('%m', scan_date) = '12' 
                ) c1
                LEFT JOIN (
                    SELECT DISTINCT route_id FROM shipment_scans 
                    WHERE strftime('%m', scan_date) = '01'
                ) c2 ON c1.route_id = c2.route_id
                WHERE c2.route_id IS NULL
            """,
            # Python correctly identifies month N-1 using exact date boundaries
            'python': lambda: len(
                set(scans_df[(scans_df['scan_date'] >= '2023-12-01') & (scans_df['scan_date'] <= '2023-12-31')]['route_id']) - 
                set(scans_df[(scans_df['scan_date'] >= '2024-01-01') & (scans_df['scan_date'] <= '2024-01-31')]['route_id'])
            ),
            'tolerance': 0
        }
    }

    validation_report = []

    for metric_name, metric_def in metrics.items():
        sql_result = pd.read_sql(metric_def['sql'], engine).iloc[0, 0]
        if sql_result is None: sql_result = 0
            
        py_result = metric_def['python']()
        
        difference = abs(sql_result - py_result)
        pct_diff = (difference / abs(sql_result)) * 100 if sql_result != 0 else 0
        match = pct_diff <= metric_def['tolerance']
        
        validation_report.append({
            'Metric': metric_name,
            'SQL_Result': sql_result,
            'Python_Result': py_result,
            'Difference': difference,
            'Pct_Difference': round(pct_diff, 2),
            'Tolerance': metric_def['tolerance'],
            'Status': 'PASS' if match else 'FAIL',
            'Timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

    return pd.DataFrame(validation_report)

# Run validation
report = validate_metrics(engine, scans_df)
print("--- Automated Metrics Validation Report ---")
print(report.to_string(index=False))

# Flag issues explicitly
print("\n--- Discrepancies Found ---")
for idx, row in report.iterrows():
    if row['Status'] == 'FAIL':
        print(f"FAIL {row['Metric']}: SQL={row['SQL_Result']}, Python={row['Python_Result']} ({row['Pct_Difference']}% difference)")
    else:
        print(f"PASS {row['Metric']}: Match within tolerance")

# Save report
report.to_csv('validation_report.csv', index=False)
print("\nReport saved to 'validation_report.csv'")
