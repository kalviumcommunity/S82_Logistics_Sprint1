# Clean Data Layer Naming Conventions

## Views
- **Prefix:** `vw_`
- **Pattern:** `vw_[business_entity]_[metric]`
- **Examples:**
  - `vw_active_routes` - Identifies routes with recent logistics activity and computes 30-day summaries.
  - `vw_route_performance` - Isolates delayed shipments to evaluate cascading risk and delay severity.

## Pre-Aggregated Tables
- **Prefix:** `agg_`
- **Pattern:** `agg_[grain]_[subject]`
- **Examples:**
  - `agg_daily_delays` - Aggregates total shipments and delays at a daily grain per region to instantly serve the Logistics Dashboard without hitting millions of raw scan records.

## Columns in Aggregated Tables
- **Always include:** `updated_at` (Timestamp of when the aggregation was computed, to warn users of stale data).
- **Always include:** Count metrics (`total_shipments`, `delayed_shipments`) alongside averages, to provide statistical context and allow for further rolling up.
- **Always include:** Date/Time grain column (e.g., `aggregation_date`).

## Benefits
- **Clarity:** A prefix like `vw_` or `agg_` instantly indicates the object type to any analyst.
- **Consistency:** Dashboards query a single source of truth, eliminating metric drift (e.g., everyone uses the same definition of what constitutes a "critical delay").
- **Performance:** Pre-computed `agg_` tables prevent resource exhaustion on the database during peak dashboard usage.
