# Dashboard Design Documentation

## Information Hierarchy Applied
- **Level 1 (Status):** 5 KPI cards covering Total Shipments, Delayed Shipments, Avg Delay, Cascading Delay Routes, and On-Time Delivery Rate. These metrics instantly show the logistics director if the network is healthy.
- **Level 2 (Trends):** 2 trend charts showing monthly delayed shipments and total vs delayed shipments. These patterns reveal seasonal trends in delays and if volume increases correlate with delays.
- **Level 3 (Segments):** 1 comparison chart showing delays by operational route, helping identify which specific route segment needs immediate attention and is bottlenecking the network.
- **Level 4 (Detail):** Sidebar filters for Route and Status, allowing analysts to drill down to specific delayed shipment records for root cause analysis.

## Design Principles Applied
1. **Progressive Disclosure:** Network health (KPI summary) is visible immediately at the top; specific shipment delay details are hidden behind filters at the bottom, so users only see details when they decide to drill down.
2. **Spatial Organisation:** Crucial volume and delay KPIs are placed at the top left. The flow naturally guides the user from summary metrics down to specific data points.
3. **Consistent Metaphor:** The color Red consistently indicates delays or negative metrics (e.g., in KPIs and trend charts). Green indicates good metrics, target lines, or positive indicators.
4. **Context Over Numbers:** Every KPI card includes period-over-period comparisons to give context, and the trend charts have a target line (e.g., target max 10 delays/month) to instantly show if current performance is acceptable.

## Colour Palette
- **Primary:** `#1f77b4` (blue) - main metrics (Total Shipments)
- **Danger:** `#d62728` (red) - negative indicators (Delays)
- **Success:** `#2ca02c` (green) - positive indicators (Targets/On-Time)
- **Secondary:** `#ff7f0e` (orange) - comparison segments

## Target Audience
- **Primary:** Logistics Director (daily user, checks KPIs and trends to ensure network stability)
- **Secondary:** Route Managers (weekly glance, reads KPI row and segment charts for route performance)
- **Tertiary:** Data Analysts (uses filters to export specific delayed shipments for predictive modeling of cascading delays)

## Data Sources
- KPI values: Computed from shipment scans and delay reports logs.
- Trend data: Aggregated monthly from historical warehouse transfer records.
- Segment data: Aggregated delay data grouped by operational routes.
