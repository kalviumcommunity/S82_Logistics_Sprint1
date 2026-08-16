import pandas as pd
import sqlite3
import numpy as np

# Set up mock database connection
engine = sqlite3.connect(':memory:')

# 1. Create mock base tables
engine.execute('CREATE TABLE routes (id INTEGER, route_name TEXT, region TEXT)')
engine.execute('CREATE TABLE shipment_scans (scan_id INTEGER, route_id INTEGER, scan_date TEXT, delay_minutes INTEGER, status TEXT)')

# Mock data generation
engine.executemany('INSERT INTO routes VALUES (?, ?, ?)', 
                   [(i, f'Route {i}', np.random.choice(['North', 'South', 'East', 'West'])) for i in range(1, 11)])
engine.executemany('INSERT INTO shipment_scans VALUES (?, ?, ?, ?, ?)',
                   [(i, np.random.randint(1, 11), f'2024-01-{np.random.randint(1, 31):02d}', 
                     np.random.randint(0, 150), np.random.choice(['On-Time', 'Delayed'])) for i in range(1000)])

# 2. Deploy Views to the Data Layer
with open('database/views/vw_active_routes.sql', 'r') as f:
    vw_active_routes_sql = f.read().split('CREATE VIEW')[1]
    engine.execute('CREATE VIEW ' + vw_active_routes_sql)

with open('database/views/vw_route_performance.sql', 'r') as f:
    vw_route_performance_sql = f.read().split('CREATE VIEW')[1]
    engine.execute('CREATE VIEW ' + vw_route_performance_sql)

# 3. Deploy Aggregated Table
with open('database/aggregations/agg_daily_delays.sql', 'r') as f:
    # Read the DDL (CREATE TABLE)
    create_table_sql = f.read().split('CREATE TABLE')[1].split(';')[0]
    engine.execute('CREATE TABLE ' + create_table_sql)

# Populate aggregated table
populate_sql = """
INSERT INTO agg_daily_delays (aggregation_date, region, total_shipments, delayed_shipments, avg_delay_minutes, updated_at)
SELECT 
    date(s.scan_date) AS aggregation_date,
    r.region,
    COUNT(s.scan_id) AS total_shipments,
    SUM(CASE WHEN s.delay_minutes > 0 THEN 1 ELSE 0 END) AS delayed_shipments,
    AVG(s.delay_minutes) AS avg_delay_minutes,
    CURRENT_TIMESTAMP AS updated_at
FROM shipment_scans s
JOIN routes r ON s.route_id = r.id
GROUP BY date(s.scan_date), r.region;
"""
engine.execute(populate_sql)

# --- Python Queries Simulating Dashboard Usage ---

print("\n--- View 1: Active Routes Metrics ---")
active_routes_df = pd.read_sql("""
    SELECT route_name, region, shipment_count_30d, total_delayed_30d, days_since_scan 
    FROM vw_active_routes 
    ORDER BY shipment_count_30d DESC LIMIT 5
""", engine)
print(active_routes_df)

print("\n--- View 2: Route Performance & Critical Cascading Risk ---")
route_perf_df = pd.read_sql("""
    SELECT route_name, avg_delay_minutes, critical_delays 
    FROM vw_route_performance 
    WHERE critical_delays > 0
    ORDER BY critical_delays DESC LIMIT 5
""", engine)
print(route_perf_df)

print("\n--- Pre-Aggregated Table: Daily Delays Summary ---")
agg_delays_df = pd.read_sql("""
    SELECT aggregation_date, region, total_shipments, delayed_shipments, round(avg_delay_minutes, 1) as avg_delay 
    FROM agg_daily_delays 
    ORDER BY aggregation_date DESC LIMIT 5
""", engine)
print(agg_delays_df)

print("\n--- Data Layer Verification ---")
print(f"Aggregated Daily Table Row Count: {pd.read_sql('SELECT COUNT(*) FROM agg_daily_delays', engine).iloc[0,0]}")
