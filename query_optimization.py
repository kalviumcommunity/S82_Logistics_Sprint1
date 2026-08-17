import pandas as pd
import sqlite3
import numpy as np

# Setup mock SQLite database
engine = sqlite3.connect(':memory:')
engine.execute('CREATE TABLE routes (id INTEGER, route_name TEXT, region TEXT, manager TEXT, contact TEXT)')
engine.execute('CREATE TABLE warehouses (id INTEGER, warehouse_name TEXT, capacity INTEGER)')
engine.execute('CREATE TABLE shipment_scans (scan_id INTEGER, route_id INTEGER, warehouse_id INTEGER, scan_date TEXT, delay_minutes INTEGER, status TEXT, operator TEXT)')

# Mock data generation
engine.executemany('INSERT INTO routes VALUES (?, ?, ?, ?, ?)', 
                   [(i, f'Route {i}', 'North', 'Alice', '123-456') for i in range(1, 11)])
engine.executemany('INSERT INTO warehouses VALUES (?, ?, ?)', 
                   [(i, f'WH_{i}', 1000) for i in range(1, 6)])
engine.executemany('INSERT INTO shipment_scans VALUES (?, ?, ?, ?, ?, ?, ?)',
                   [(i, np.random.randint(1, 11), np.random.randint(1, 6), 
                     '2024-01-05', np.random.randint(0, 120), 'Scanned', 'Bob') for i in range(1000)])

print("--- Task 1: Refactor Query 1 - SELECT * to Explicit Columns ---")
# Original (Inefficient):
original_query_1 = """
SELECT * 
FROM shipment_scans s 
JOIN routes r ON s.route_id = r.id 
WHERE strftime('%Y', s.scan_date) = '2024' 
LIMIT 100;
"""

# Optimized: Select only needed columns for cascading delay analysis
optimized_query_1 = """
SELECT 
    s.scan_id, 
    s.scan_date, 
    s.delay_minutes, 
    r.route_name, 
    r.region
FROM shipment_scans s 
JOIN routes r ON s.route_id = r.id 
WHERE strftime('%Y', s.scan_date) = '2024' 
LIMIT 100;
"""

original_result_1 = pd.read_sql(original_query_1, engine)
optimized_result_1 = pd.read_sql(optimized_query_1, engine)
print(f"Original columns: {original_result_1.shape[1]}")
print(f"Optimized columns: {optimized_result_1.shape[1]}")
print(f"Improvement: {((original_result_1.shape[1] - optimized_result_1.shape[1])/original_result_1.shape[1])*100:.1f}% fewer columns\n")


print("--- Task 2: Refactor Query 2 - Apply Filters Before JOINs ---")
# Original (Joins then filters):
inefficient_query_2 = """
SELECT s.scan_id, s.delay_minutes, r.route_name, w.warehouse_name 
FROM shipment_scans s 
JOIN routes r ON s.route_id = r.id 
JOIN warehouses w ON s.warehouse_id = w.id 
WHERE s.scan_date >= '2024-01-01' 
  AND s.delay_minutes > 60 
  AND r.region = 'North' 
LIMIT 500;
"""

# Efficient (Filters first):
efficient_query_2 = """
WITH filtered_scans AS (
    SELECT scan_id, route_id, warehouse_id, delay_minutes 
    FROM shipment_scans 
    WHERE scan_date >= '2024-01-01' AND delay_minutes > 60
)
SELECT fs.scan_id, fs.delay_minutes, r.route_name, w.warehouse_name 
FROM filtered_scans fs 
JOIN routes r ON fs.route_id = r.id 
JOIN warehouses w ON fs.warehouse_id = w.id
WHERE r.region = 'North';
"""

transactions_count = pd.read_sql("SELECT COUNT(*) FROM shipment_scans", engine).iloc[0,0]
filtered_transactions = pd.read_sql("SELECT COUNT(*) FROM shipment_scans WHERE scan_date >= '2024-01-01' AND delay_minutes > 60", engine).iloc[0,0]

print(f"Original table: {transactions_count:,} rows")
print(f"After filter (before join): {filtered_transactions:,} rows ({(filtered_transactions/transactions_count)*100:.1f}%)")
print(f"Reduction factor: {transactions_count / max(1, filtered_transactions):.1f}x smaller dataset before joining\n")


print("--- Task 3: Refactor Query 3 - Use CTEs for Readability ---")
# Original (Nested subqueries, hard to read):
original_query_3 = """
SELECT region, AVG(avg_delay) as region_avg_delay FROM (
    SELECT r.region, AVG(s.delay_minutes) as avg_delay, COUNT(DISTINCT s.scan_id) as scan_count 
    FROM (
        SELECT s.scan_id, s.delay_minutes, s.route_id 
        FROM shipment_scans s 
        WHERE s.scan_date >= '2024-01-01'
    ) s 
    JOIN routes r ON s.route_id = r.id 
    GROUP BY r.region
) grouped ORDER BY region_avg_delay DESC;
"""

# Optimized with CTEs
refactored_query_3 = """
WITH recent_scans AS (
    -- Step 1: Filter to recent logistics data
    SELECT scan_id, delay_minutes, route_id 
    FROM shipment_scans 
    WHERE scan_date >= '2024-01-01'
),
scans_with_region AS (
    -- Step 2: Join to route data to get region
    SELECT rs.scan_id, rs.delay_minutes, r.region 
    FROM recent_scans rs 
    JOIN routes r ON rs.route_id = r.id
),
region_metrics AS (
    -- Step 3: Calculate region-level delay metrics
    SELECT 
        region, 
        COUNT(DISTINCT scan_id) as scan_count, 
        AVG(delay_minutes) as region_avg_delay 
    FROM scans_with_region 
    GROUP BY region
)
SELECT region, region_avg_delay, scan_count 
FROM region_metrics 
ORDER BY region_avg_delay DESC;
"""
result_3 = pd.read_sql(refactored_query_3, engine)
print(result_3)
