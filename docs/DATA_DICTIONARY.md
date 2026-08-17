# Data Dictionary

## Dataset Overview

This dataset contains logistics operation records drawn from three source systems:
shipment scan events, delay reports, and warehouse transfer logs. Together they
enable analysis of cascading delivery delays across operational routes.

- **Last Updated**: 2025-05-21
- **Maintained By**: Data Engineering Team
- **Source Systems**: Scan Event DB · Delay Report DB · Warehouse Transfer Log
- **Refresh Cadence**: Daily (scan events), weekly (delay reports), daily (transfers)
- **Primary Problem**: Predicting which routes consistently produce cascading delivery delays

---

## Columns

### shipment_id
- **Type**: String
- **Business Meaning**: Primary tracking reference that links scan events, delay reports, and warehouse transfer records for a single shipment
- **Example**: `SHP-20250115-00123`
- **Format**: `SHP-YYYYMMDD-NNNNN`
- **Null Handling**: Never null -- primary key; pipeline rejects rows missing this value
- **Related KPI**: Shipment throughput, unique shipment volume
- **Updates**: Assigned at origin scan; immutable thereafter

---

### scan_timestamp
- **Type**: Datetime (UTC)
- **Business Meaning**: The exact moment a shipment moved through a logistics checkpoint. Used to compute dwell times, SLA compliance windows, and delay durations
- **Example**: `2025-01-15T14:32:00Z`
- **Null Handling**: Never null -- a row without a timestamp is meaningless; reject at ingestion
- **Related KPI**: On-time delivery rate, checkpoint dwell time, SLA breach count
- **Updates**: Written at time of barcode scan; immutable
- **Notes**: Always store and compare in UTC; convert to local timezone only for display

---

### scan_location
- **Type**: String
- **Business Meaning**: The physical checkpoint (warehouse, hub, port, or transit point) where the scan occurred. Identifies the route leg and facility load
- **Example**: `Mumbai-WH-01`
- **Format**: `CITY-TYPE-SEQ` where TYPE is `WH` (Warehouse), `TR` (Transit), `PRT` (Port)
- **Null Handling**: If null, classify as `UNKNOWN-LOCATION`; flag for ops review
- **Related KPI**: Route efficiency score, facility throughput, congestion index
- **Updates**: Static lookup; new entries added when facilities open

---

### route_id
- **Type**: String
- **Business Meaning**: The planned operational path from origin to destination. Used to group shipments onto the same route for delay pattern analysis
- **Example**: `RT-MUM-DEL-04`
- **Null Handling**: Null means route not assigned; exclude from route-level aggregations
- **Related KPI**: Route delay rate, cascading delay propagation rate, route risk score
- **Updates**: Assigned at shipment creation; routes updated in route master monthly
- **Notes**: Multiple routes may share physical legs; see `route_segments` table for sub-path mapping

---

### delay_minutes
- **Type**: Integer
- **Business Meaning**: Operational lateness at a given checkpoint -- the number of minutes between scheduled and actual scan time
- **Example**: `45`
- **Interpretation**: Positive = late; `0` = on-time; Negative = early arrival
- **Null Handling**: Null means the scan was missed entirely -- treat as a severe data quality issue; impute with median for modeling
- **Related KPI**: Mean delay per route, delay frequency distribution, SLA breach rate
- **Updates**: Computed at scan time against the schedule

---

### delay_reason_code
- **Type**: String (categorical)
- **Business Meaning**: Root cause classification enabling operational teams to intervene on the correct problem (weather, capacity, customs, vehicle breakdown)
- **Example**: `WTH-01`
- **Valid Values**:
  - `WTH` -- Weather (external; not actionable)
  - `OPS` -- Operational capacity (addressable through scheduling)
  - `CUS` -- Customs clearance (addressable through pre-clearance)
  - `VHL` -- Vehicle breakdown (addressable through maintenance)
- **Null Handling**: Null if no delay (delay_minutes = 0); required when delay_minutes > 0
- **Related KPI**: Delay root cause distribution, actionable vs. non-actionable delay ratio
- **Updates**: Entered by operations team within 24 hours of delay event

---

### warehouse_id
- **Type**: String
- **Business Meaning**: Identifies which facility currently holds or processed the shipment. Drives facility-level congestion and dwell time analysis
- **Example**: `WH-BLR-03`
- **Null Handling**: Null when shipment is in transit between facilities; expected and valid
- **Related KPI**: Warehouse dwell time, facility congestion index, inter-facility transfer SLA
- **Updates**: Foreign key to `warehouses` master table; updated on each warehouse scan

---

### transfer_timestamp
- **Type**: Datetime (UTC)
- **Business Meaning**: The exact moment a shipment transferred custody or physical location between two warehouse facilities. Critical for detecting where cascading delays originate in the warehouse network
- **Example**: `2025-01-16T08:00:00Z`
- **Null Handling**: Null when no transfer occurred on this route leg -- valid and expected
- **Related KPI**: Inter-facility transfer rate, warehouse handoff SLA compliance, cascading delay source detection
- **Updates**: Written at time of transfer scan; immutable

---

### origin_city
- **Type**: String
- **Business Meaning**: Source city for the shipment, used to identify high-volume origin lanes and map demand patterns
- **Example**: `Mumbai`
- **Null Handling**: Never null -- required for route assignment; reject at ingestion
- **Related KPI**: Origin-destination pair volume, revenue by lane, route load balancing
- **Updates**: Set at shipment creation from CRM address; standardized to ISO city name

---

### destination_city
- **Type**: String
- **Business Meaning**: Target delivery city, used to assign SLA tiers and measure last-mile performance
- **Example**: `Delhi`
- **Null Handling**: Never null -- reject at ingestion
- **Related KPI**: Delivery SLA compliance rate, last-mile failure rate, city-level delay concentration
- **Updates**: Set at shipment creation; immutable

---

### carrier_id
- **Type**: String
- **Business Meaning**: The logistics partner or internal fleet vehicle that physically transported the shipment. Used for vendor scorecards and carrier-level delay attribution
- **Example**: `CAR-DTDC-01`
- **Null Handling**: Null when movement is internal; flag for investigation when null on external routes
- **Related KPI**: Carrier on-time rate, carrier delay contribution, vendor SLA scorecard
- **Updates**: Foreign key to `carriers` master table; assigned when pickup scan occurs

---

### shipment_weight_kg
- **Type**: Float
- **Business Meaning**: Physical weight in kilograms, used as a proxy for vehicle load factor and cost-per-shipment calculation
- **Example**: `12.5`
- **Unit**: Kilograms
- **Null Handling**: Null if not captured at scan; impute with median weight for cost modeling
- **Related KPI**: Load factor per vehicle, cost per kg, route capacity utilization
- **Updates**: Measured at origin scan; rarely changes

---

### flag_cascading_delay
- **Type**: Integer (binary: 0 or 1)
- **Business Meaning**: Indicates whether the delay at this checkpoint propagated and caused missed SLAs at one or more downstream route legs -- the primary target variable for the delay prediction model
- **Example**: `1`
- **Valid Values**: `0` = delay did not cascade; `1` = delay cascaded to downstream legs
- **Null Handling**: Never null after profiling; fill with `0` if missing (assume no cascade)
- **Related KPI**: Cascading delay rate per route, route risk score
- **Updates**: Computed in post-processing after full route completion (T+24h lag)

---

### cust_segment
- **Type**: String (categorical)
- **Business Meaning**: The business tier of the customer, determining SLA priority level, pricing tier, and go-to-market strategy
- **Example**: `B2B`
- **Valid Values**: `B2B`, `B2C`, `SMB`, `ENTERPRISE`
- **Null Handling**: Classify null as `UNKNOWN`; investigate source CRM record
- **Related KPI**: Segment on-time rate, segment revenue contribution, segment churn rate
- **Updates**: Updated monthly from CRM classification system

---

### trnx_amt
- **Type**: Float
- **Business Meaning**: Revenue in USD generated from this shipment. Used for route-level profitability and customer lifetime value calculations
- **Example**: `150.99`
- **Unit**: USD
- **Null Handling**: Null for internal transfers (no commercial transaction); exclude from revenue aggregations when null
- **Related KPI**: Monthly revenue, revenue per route, customer lifetime value, average transaction value
- **Updates**: Set when transaction completes in billing system; strip `$` and `,` symbols before numeric conversion

---

## Column to KPI Mapping

### On-Time Delivery Rate
- **Formula**: `COUNT(delay_minutes <= 0) / COUNT(shipment_id)`
- **Related Columns**: `delay_minutes`, `scan_timestamp`, `shipment_id`
- **Why It Matters**: The headline SLA metric reported to customers and leadership
- **Update Frequency**: Daily

### Cascading Delay Rate per Route
- **Formula**: `SUM(flag_cascading_delay) / COUNT(shipment_id) grouped by route_id`
- **Related Columns**: `flag_cascading_delay`, `route_id`, `shipment_id`
- **Why It Matters**: Identifies which routes are structurally prone to propagating delays -- core to the problem statement
- **Update Frequency**: Daily (with T+24h lag for cascade detection)

### Monthly Revenue
- **Formula**: `SUM(trnx_amt) grouped by month(scan_timestamp)`
- **Related Columns**: `trnx_amt`, `scan_timestamp`
- **Why It Matters**: Tracks total company revenue by period
- **Update Frequency**: Daily

### Delay Root Cause Distribution
- **Formula**: `COUNT(delay_reason_code) / SUM(delay_minutes > 0) grouped by delay_reason_code`
- **Related Columns**: `delay_reason_code`, `delay_minutes`
- **Why It Matters**: Separates actionable (OPS, VHL) from non-actionable (WTH) delays for intervention targeting
- **Update Frequency**: Weekly

### Warehouse Dwell Time
- **Formula**: `AVG(transfer_timestamp - scan_timestamp) grouped by warehouse_id`
- **Related Columns**: `transfer_timestamp`, `scan_timestamp`, `warehouse_id`
- **Why It Matters**: Measures how long shipments sit in a facility -- excess dwell is a primary cascade trigger
- **Update Frequency**: Daily

### Carrier On-Time Rate
- **Formula**: `COUNT(delay_minutes <= 0) / COUNT(shipment_id) grouped by carrier_id`
- **Related Columns**: `carrier_id`, `delay_minutes`, `shipment_id`
- **Why It Matters**: Vendor scorecard metric for carrier SLA compliance and contract renewal decisions
- **Update Frequency**: Weekly

---

## Ambiguous Columns & Resolutions

### Column: flag_cascading_delay
- **Original Ambiguity**: Does it mean "this shipment is currently delayed" or "this shipment's delay affected downstream shipments"?
- **Resolved Meaning**: Binary indicator that the delay at this checkpoint propagated to one or more downstream route legs, causing those legs to also miss their scheduled scan times
- **Business Interpretation**: Historical cascade label used to train the predictive delay model; describes what already happened, not the current state
- **Proposed Rename**: `has_cascaded_downstream`
- **Risk If Misunderstood**: Model trained on the wrong definition will predict wrong events, making the delay prevention system unreliable

### Column: cust_segment
- **Original Ambiguity**: Is this the customer's market segment, product category segment, geographic region, or pricing tier?
- **Resolved Meaning**: Customer market segment (`B2B`, `B2C`, `SMB`, `ENTERPRISE`) sourced monthly from CRM -- determines SLA tier and pricing
- **Business Interpretation**: Drives which SLA window applies to the shipment; `ENTERPRISE` gets 24h SLA vs `B2C` gets 72h
- **Proposed Rename**: `market_segment`
- **Risk If Misunderstood**: SLA compliance calculations applied to the wrong segment produce misleading KPI reports that misinform customer conversations

### Column: scan_location
- **Original Ambiguity**: Is this the GPS coordinate, a facility name, a city, or an internal facility code?
- **Resolved Meaning**: Encoded facility identifier in format `CITY-TYPE-SEQ` representing the physical checkpoint where the barcode scan occurred
- **Business Interpretation**: Maps to a row in the `facilities` master table; used to reconstruct the physical route a shipment traveled
- **Proposed Rename**: `facility_code`
- **Risk If Misunderstood**: Route reconstruction joins fail or produce incorrect paths, breaking delay attribution logic

---

## Column Relationships

### Revenue per Route
- **Definition**: `SUM(trnx_amt)` grouped by `route_id`
- **How It Matters**: Identifies which routes generate the most revenue, allowing the business to prioritize high-value routes for SLA investment and delay reduction
- **Example**: "Route RT-MUM-DEL-04 generates 30% of monthly revenue but has the highest cascade delay rate -- priority for operational intervention"
- **Related Columns**: `trnx_amt`, `route_id`, `shipment_id`

### Cascading Delay Source Detection
- **Definition**: Shipments where `flag_cascading_delay = 1` joined with `warehouse_id` and `transfer_timestamp` to find which facility handoff triggered the cascade
- **How It Matters**: Pinpoints the exact warehouse transfer that caused downstream delays, enabling targeted remediation (staffing, scheduling, capacity)
- **Example**: "80% of cascades on route RT-MUM-DEL-04 originate at transfer from WH-NGP-01 between 02:00-04:00 UTC -- night shift capacity issue"
- **Related Columns**: `flag_cascading_delay`, `warehouse_id`, `transfer_timestamp`, `route_id`, `scan_timestamp`

### Segment SLA Compliance
- **Definition**: On-time delivery rate grouped by `cust_segment`, filtered by SLA threshold per segment tier
- **How It Matters**: Different segments have different contracted SLAs; tracking compliance separately reveals which customer tiers are being failed
- **Example**: "ENTERPRISE segment SLA compliance is 97% vs B2C at 82% -- B2C customers experiencing systematic under-service"
- **Related Columns**: `cust_segment`, `delay_minutes`, `scan_timestamp`, `shipment_id`

### Delay Propagation Chain
- **Definition**: Ordered sequence of `scan_timestamp`, `scan_location`, and `delay_minutes` for the same `shipment_id` where each leg's delay exceeds the previous
- **How It Matters**: Reveals the chain reaction pattern -- a 30-minute delay at checkpoint 1 becomes 120 minutes at checkpoint 3 -- quantifying the amplification factor per route
- **Example**: "Average cascade amplification factor on mountain routes is 3.2x -- a 1-hour origin delay becomes 3.2 hours at delivery"
- **Related Columns**: `shipment_id`, `scan_timestamp`, `scan_location`, `delay_minutes`, `route_id`, `flag_cascading_delay`
