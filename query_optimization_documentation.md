# Analytical SQL Query Optimisation - Documentation

## Task 4: Compare & Document Improvements

### Summary Table

| Metric | Original | Optimized |
| :--- | :--- | :--- |
| **Columns Selected** | 12 (SELECT *) | 5 explicit |
| **Intermediate Rows** | 100M rows (estimated) | 5M rows (estimated) |
| **Filters Applied Before Join** | No | Yes |
| **Nesting Depth** | 3 levels | 1 level (CTEs) |
| **Readability Score** | Hard to follow | Clear sequential steps |

### Specific Improvements Identified

#### Query 1: SELECT * vs Explicit Columns
- **Inefficiency:** Fetching all columns (`SELECT *`) from `shipment_scans` and `routes` pulled 12 columns, including unused ones like `manager` and `operator`.
- **Change Made:** Explicitly selected only `scan_id, scan_date, delay_minutes, route_name, region`.
- **Impact:** Memory usage significantly reduced. Prevented silent schema-breakage. Intent is documented via selected columns.

#### Query 2: Early Filtering Before JOINs
- **Inefficiency:** Filtered `scan_date >= '2024-01-01' AND delay_minutes > 60` after joining a 100M row transaction table with `routes` and `warehouses`, creating huge memory pressure.
- **Change Made:** Used a CTE (`filtered_scans`) to apply `WHERE` filters *before* the `JOIN` operations.
- **Impact:** Reduced the base dataset from 100M rows to ~5M rows before the expensive join operations, speeding up execution by orders of magnitude.

#### Query 3: CTE Restructuring
- **Inefficiency:** Logic was deeply nested in multiple subqueries, making debugging impossible without tearing the query apart.
- **Change Made:** Broke logic into three CTEs: `recent_scans`, `scans_with_region`, and `region_metrics`.
- **Impact:** Query reads top-to-bottom. Each CTE is independently testable, significantly improving maintainability for data analysts.

---

## Task 5: Follow-Up Questions

**1. High-Cardinality Column Indexing**
If we put an index on `scan_id` or `route_id`, the database engine can rapidly locate rows matching the `WHERE` clause without scanning the entire 100M row table (Full Table Scan). It acts like an index in a book. The tradeoff is that every `INSERT`, `UPDATE`, or `DELETE` to the `shipment_scans` table now carries a slight penalty because the index tree must be updated. It also consumes additional disk space.

**2. CTE Caching vs Recalculation**
If a CTE is referenced multiple times in the same query execution, most modern analytical databases (like Snowflake or BigQuery) and advanced engines (like PostgreSQL) will materialize/cache the intermediate result of the CTE so it isn't recalculated. However, simpler or older engines might evaluate it inline every time it's referenced. PostgreSQL 12+ lets you enforce materialization using `AS MATERIALIZED`.

**3. Techniques for Massive Filtered Datasets**
If the filtered dataset remains huge (e.g., 100M rows):
- **Partitioning:** We can partition the `shipment_scans` table by `scan_date` (e.g., monthly). The query planner will automatically prune (skip) partitions outside the date range.
- **Pre-aggregation / Materialized Views:** If dashboards only need daily averages instead of raw transaction rows, we can create a `daily_route_delays_mv` materialized view that computes and stores aggregated metrics, allowing dashboards to query millions of rows in milliseconds.
