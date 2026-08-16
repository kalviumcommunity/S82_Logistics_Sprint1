-- Table: agg_daily_delays
-- Purpose: Pre-aggregated daily summary of shipments and delays to serve dashboards instantly
-- Grain: Daily
-- Subject: Logistics Delays

CREATE TABLE agg_daily_delays (
    aggregation_date DATE,
    region VARCHAR(100),
    total_shipments INTEGER,
    delayed_shipments INTEGER,
    avg_delay_minutes NUMERIC,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example Refresh Strategy (Full Insert for daily batch):
-- INSERT INTO agg_daily_delays
-- SELECT 
--     DATE(s.scan_date) AS aggregation_date,
--     r.region,
--     COUNT(s.scan_id) AS total_shipments,
--     SUM(CASE WHEN s.delay_minutes > 0 THEN 1 ELSE 0 END) AS delayed_shipments,
--     AVG(s.delay_minutes) AS avg_delay_minutes,
--     CURRENT_TIMESTAMP AS updated_at
-- FROM shipment_scans s
-- JOIN routes r ON s.route_id = r.id
-- GROUP BY DATE(s.scan_date), r.region;
