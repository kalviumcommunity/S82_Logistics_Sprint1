# Logistics Delay Prediction Dashboard Design

## SQL Window Functions & Ranking Systems Applied
This dashboard leverages advanced SQL window functions to push complex analytical logic into the database layer rather than relying on Python pandas transformations.

### 1. `LAG()` for Month-over-Month KPIs
To display the KPI cards with period-over-period deltas, we used the `LAG()` function partitioned over the `scan_date` (Month). This allows the SQL query to return the current month's total volume alongside the previous month's volume in a single row. The dashboard instantly computes the delta percentage from this row.

### 2. `LEAD()` for Trend Forecasting Comparison
The `LEAD()` function is used in our trend aggregation queries to pull the "next month's" delayed volume. While visualizing historical data, having immediate access to `LEAD()` allows us to spot cascading trends (e.g., if delays spiked this month, what was the immediate following month's behavior?).

### 3. `RANK()` and `ROW_NUMBER()` for Route Bottleneck Identification
In Level 3 (Route Segments), we used `RANK() OVER (ORDER BY total_delayed DESC)` to dynamically rank the operational routes based on their failure rate. 
- **`RANK()`** ensures that if two routes have identical delay counts, they receive a tied rank (e.g., 1, 1, 3). 
- **`ROW_NUMBER()`** is also included to guarantee a unique identifier for UI list rendering, resolving ties arbitrarily without duplicating row indices.

---

## Information Hierarchy Applied
- **Level 1 (Status):** 5 KPI cards covering Total Shipments, Delayed Shipments, Avg Delay, and the Top Worst Performing Routes (computed via `RANK`). 
- **Level 2 (Trends):** Trend chart showing monthly delayed shipments.
- **Level 3 (Segments):** 1 comparison chart showing delays by operational route, ranked descending using `RANK()`.
- **Level 4 (Detail):** Detailed ranking table explorer.

## Design Principles Applied
1. **Progressive Disclosure:** Network health is visible immediately; specific rankings are below.
2. **Spatial Organisation:** Crucial volume and delay KPIs at the top left.
3. **Consistent Metaphor:** Red consistently indicates delays/bad metrics. The `#1` ranked worst route is colored red.
4. **Context Over Numbers:** KPIs include period-over-period changes powered by SQL `LAG()`.

## Target Audience
- **Primary:** Logistics Director
- **Secondary:** Route Managers
- **Tertiary:** Data Analysts (inspecting raw SQL rank distributions)
