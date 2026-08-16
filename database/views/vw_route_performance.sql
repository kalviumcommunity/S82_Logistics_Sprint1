-- View: vw_route_performance
-- Purpose: Measure operational efficiency and cascading delay potential per route
-- Business metric: Route performance and delay severity
-- Updated: Automatically with each query
-- Used by: Supply chain analysts, warehouse managers
--
-- Columns:
-- route_id: Unique route identifier
-- route_name: Route display name
-- avg_delay_minutes: Average delay time per shipment
-- critical_delays: Count of shipments delayed over 120 minutes (cascading risk)

CREATE VIEW vw_route_performance AS
SELECT 
    r.id AS route_id,
    r.route_name,
    AVG(s.delay_minutes) AS avg_delay_minutes,
    SUM(CASE WHEN s.delay_minutes > 120 THEN 1 ELSE 0 END) AS critical_delays
FROM routes r
JOIN shipment_scans s ON r.id = s.route_id
WHERE s.status = 'Delayed'
GROUP BY r.id, r.route_name;
