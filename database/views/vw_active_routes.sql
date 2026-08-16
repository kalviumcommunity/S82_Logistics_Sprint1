-- View: vw_active_routes
-- Purpose: Identify active operational routes with recent logistics activity (last 30 days)
-- Business metric: Routes active in rolling 30-day window
-- Updated: Automatically with each query (view recalculates)
-- Used by: Logistics operations dashboard, capacity planning
--
-- Columns:
-- route_id: Unique route identifier
-- route_name: Route display name
-- region: Geographical region
-- shipment_count_30d: Number of shipments in last 30 days
-- total_delayed_30d: Total delayed shipments from last 30 days
-- last_scan_date: Most recent shipment scan date
-- days_since_scan: Days elapsed since last scan on this route

CREATE VIEW vw_active_routes AS
SELECT 
    r.id AS route_id,
    r.route_name,
    r.region,
    COUNT(DISTINCT s.scan_id) AS shipment_count_30d,
    SUM(CASE WHEN s.delay_minutes > 0 THEN 1 ELSE 0 END) AS total_delayed_30d,
    MAX(s.scan_date) AS last_scan_date,
    CAST(julianday('now') - julianday(MAX(s.scan_date)) AS INTEGER) AS days_since_scan
FROM routes r
LEFT JOIN shipment_scans s ON r.id = s.route_id 
    AND s.scan_date >= date('now', '-30 day')
GROUP BY r.id, r.route_name, r.region;
