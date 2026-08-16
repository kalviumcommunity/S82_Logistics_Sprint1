# SQL vs Python: Metric Discrepancy Analysis

## 1. Dormant Routes Metric Discrepancy Analysis

**Observed Difference:**
- SQL Result: 1 dormant route
- Python Result: 1 dormant route
- *Note:* In a broader dataset, the SQL query would fail catastrophically across years. Although the mock matched in this specific small subset (because Dec is 12 and Jan is 01), if we had data from `2022-12` and `2023-01`, the SQL query's use of `strftime('%m')` would erroneously group 2022 and 2023 data together. The Python script correctly bounds the exact date range (e.g., `2023-12-01` to `2023-12-31`).

**Investigation Steps:**
1. Hand-computed the dormant routes for Dec 2023 vs Jan 2024. Route 1 was active in Dec, not Jan (Total: 1). Route 2 was active in both. Route 3 was active in Jan only.
2. The Python result correctly identified 1 route.
3. Examined the SQL query: The SQL query used `MONTH(order_date)` or `strftime('%m', scan_date)` which strips the year context. 

**Root Cause:**
The SQL query was filtering solely by the month integer. Across year boundaries (e.g., Dec 2023 to Jan 2024), or when a dataset spans multiple years, all "Decembers" are merged, and all "Januaries" are merged. This is a severe logic flaw (Computation Drift due to Date handling).

**Fix Applied (Hypothetical):**
Change the SQL query to explicitly filter by date ranges matching the Python script:
```sql
SELECT DISTINCT route_id FROM shipment_scans WHERE scan_date >= '2023-12-01' AND scan_date < '2024-01-01'
```
After this fix, both layers safely process multi-year data.

---

## 2. Follow-Up Question: Why is Manual Review Necessary?

**Question:** You have a validation script that runs daily and catches metrics drift automatically. However, it flags a discrepancy but does not auto-fix it - someone must investigate. Why is manual investigation necessary? What would be the risk of auto-fixing based on a tolerance threshold alone?

**Answer:**
1. **Tolerance Thresholds Catch Divergence, Not Correctness:** If SQL says 50 and Python says 75, the script knows they differ, but it *doesn't know which one is correct*. Auto-fixing might force Python to output 50, propagating an incorrect metric to stakeholders.
2. **Creeping Drift:** A metric might drift 0.05% every day (under a 0.1% tolerance). If it auto-fixes or ignores it, the metric slowly corrupts over weeks without anyone knowing. Manual review ensures we catch *why* it drifted.
3. **Root Cause Context:** A discrepancy is a symptom of a deeper logic gap (e.g., mishandling NULLs, or timezone shifts). If we just "auto-fix" the number, we leave the broken logic in the pipeline. Manual review ensures we actually repair the SQL view or Python function at the root.
