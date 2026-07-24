# Data Dictionary

## Dataset Overview
This unified dataset synthesizes customer transaction records, **shipment scans**, **delay reports**, and **warehouse transfer records** updated daily from the logistics management and CRM systems. 

By unifying isolated data silos into a structured data dictionary, this resource serves as the single source of truth for predictive models and operational analytics—specifically enabling the team to **predict which operational routes consistently produce cascading delivery delays**.

* **Last Updated**: 2025-05-21
* **Maintained By**: Data Engineering & Logistics Analytics Team

---

## Columns

### customer_id
- **Type**: Integer
- **Business Meaning**: Unique customer identifier from CRM system
- **Example**: `12456`
- **Null Handling**: Never null (primary key)
- **Related KPI**: Customer tracking, lifetime value calculation
- **Updates**: Assigned when customer created in CRM

### trnx_amt  
- **Type**: Float
- **Business Meaning**: Revenue from single transaction / shipment contract fee
- **Example**: `150.99`
- **Unit**: USD
- **Null Handling**: Very rare - investigate if found
- **Related KPI**: Monthly revenue, average transaction value, customer lifetime value
- **Updates**: Set when transaction completes

### purchase_date
- **Type**: Datetime
- **Business Meaning**: Date and time transaction occurred / shipment was booked
- **Example**: `2025-01-15 08:30:00`
- **Timezone**: UTC
- **Null Handling**: Never null
- **Related KPI**: Sales velocity, revenue trend analysis
- **Updates**: Set at transaction creation

### cust_segment
- **Type**: String
- **Business Meaning**: Customer market classification (B2B/B2C/SMB)
- **Valid Values**: `B2B`, `B2C`, `SMB`
- **Example**: `B2B`
- **Null Handling**: If null, classify as `UNKNOWN`
- **Related KPI**: Segment revenue, segment churn rate
- **Updates**: Monthly from CRM classification

### flag_churn
- **Type**: Integer (0/1)
- **Business Meaning**: Churn indicator flagging if customer cancelled contract within 90 days following severe delivery delays
- **Valid Values**: `0` (Retained), `1` (Churned)
- **Example**: `0`
- **Null Handling**: Defaults to `0`
- **Related KPI**: Churn rate prediction, customer retention risk
- **Updates**: Updated quarterly based on activity window

### shipment_id
- **Type**: String
- **Business Meaning**: Unique tracking identifier for parcel or freight consignment
- **Example**: `SHP-98421`
- **Null Handling**: Never null
- **Related KPI**: Package tracking, shipment completion rate
- **Updates**: Generated upon shipment creation

### scan_timestamp
- **Type**: Datetime
- **Business Meaning**: Exact timestamp when shipment scan was recorded at a logistics node
- **Example**: `2025-01-15 14:30:00`
- **Timezone**: UTC
- **Null Handling**: Never null
- **Related KPI**: Scan velocity, transit interval accuracy
- **Updates**: Recorded in real time upon barcode scan

### event_type
- **Type**: String
- **Business Meaning**: Operational scan checkpoint category in transit journey
- **Valid Values**: `INBOUND_ARRIVED`, `SORTING`, `OUTBOUND_DEPARTED`, `DELIVERED`, `EXCEPTION`
- **Example**: `SORTING`
- **Null Handling**: Never null
- **Related KPI**: Operational velocity, hub throughput rate
- **Updates**: Pushed directly via Redis Stream ingestion

### warehouse_id
- **Type**: String
- **Business Meaning**: Identifier for warehouse, sorting facility, or transfer hub node
- **Example**: `WH-ORD-01`
- **Null Handling**: Never null for hub events
- **Related KPI**: Hub processing efficiency, warehouse bottleneck index
- **Updates**: Assigned based on physical facility location

### route_id
- **Type**: String
- **Business Meaning**: Operational transit corridor connecting origin node to destination node
- **Example**: `ORD-JFK-04`
- **Null Handling**: Null for static warehouse events, required for transit legs
- **Related KPI**: Route on-time performance (OTP), route delay risk index
- **Updates**: Assigned during journey route planning

### dwell_duration_min
- **Type**: Float
- **Business Meaning**: Total time spent (in minutes) held at a warehouse transfer hub
- **Example**: `145.5`
- **Unit**: Minutes
- **Null Handling**: `0.0` if in transit without stop
- **Related KPI**: Warehouse dwell efficiency, dwell SLA compliance
- **Updates**: Computed upon outbound scan event

### queue_length
- **Type**: Integer
- **Business Meaning**: Active package processing queue depth at warehouse hub during scan
- **Example**: `342`
- **Null Handling**: Defaults to `0`
- **Related KPI**: Facility congestion index, queue processing velocity
- **Updates**: Monitored and updated dynamically in real time

### delay_reason_code
- **Type**: String
- **Business Meaning**: Categorical root cause code for logged delay exception
- **Valid Values**: `NONE`, `WEATHER`, `YARD_CONGESTION`, `MECHANICAL`, `CUSTOMS`, `STAFFING`
- **Example**: `YARD_CONGESTION`
- **Null Handling**: `NONE` if no delay occurred
- **Related KPI**: Delay cause distribution, SLA exception breakdown
- **Updates**: Logged by facility supervisors or automated exception triggers

### flag_delay
- **Type**: Integer (0/1)
- **Business Meaning**: Binary indicator of whether shipment exceeded baseline schedule threshold
- **Valid Values**: `0` (On-Time), `1` (Delayed)
- **Example**: `1`
- **Null Handling**: Defaults to `0`
- **Related KPI**: Shipment delay rate, overall route reliability
- **Updates**: Evaluated upon each scan checkpoint

### flag_cascade
- **Type**: Integer (0/1)
- **Business Meaning**: Binary indicator showing whether an upstream delay caused missed connection windows on downstream routes
- **Valid Values**: `0` (Isolated / No Cascade), `1` (Cascading Delay)
- **Example**: `1`
- **Null Handling**: Defaults to `0`
- **Related KPI**: Cascading delay propagation rate, network vulnerability index
- **Updates**: Computed by journey reconstruction background worker

### cascade_risk_score
- **Type**: Float (0.0 - 100.0)
- **Business Meaning**: Predictive model risk index estimating probability of triggering downstream cascading delays across connecting routes
- **Example**: `82.4`
- **Unit**: Percentage score (0 - 100)
- **Null Handling**: Defaults to `0.0`
- **Related KPI**: Route risk index, preventive intervention priority
- **Updates**: Re-calculated dynamically by machine learning inference engine

---

## Column to KPI Mapping

### Monthly Revenue
- **Formula**: `SUM(trnx_amt)`
- **Related Columns**: `trnx_amt`, `purchase_date`
- **Why It Matters**: Tracks total company revenue generated across shipment contracts.
- **Update Frequency**: Daily

### Sales Velocity  
- **Formula**: `COUNT(transactions) / days`
- **Related Columns**: `purchase_date`
- **Why It Matters**: Measures transaction volume rate and sales momentum over time.
- **Update Frequency**: Weekly

### Segment Revenue
- **Formula**: `SUM(trnx_amt) grouped by cust_segment`
- **Related Columns**: `trnx_amt`, `cust_segment`
- **Why It Matters**: Identifies most profitable market segments and guides contract pricing strategies.
- **Update Frequency**: Monthly

### Churn Rate
- **Formula**: `SUM(flag_churn) / total_customers`
- **Related Columns**: `flag_churn`, `customer_id`
- **Why It Matters**: Critical customer retention metric tracking revenue loss tied to delivery SLA breaches.
- **Update Frequency**: Quarterly

### Cascading Delay Rate
- **Formula**: `SUM(flag_cascade) / total_delayed_shipments`
- **Related Columns**: `flag_cascade`, `flag_delay`, `route_id`
- **Why It Matters**: Core operational metric tracking the proportion of route delays that propagate across downstream transit legs.
- **Update Frequency**: Real-time / Daily

### Route On-Time Performance (OTP)
- **Formula**: `(Total Shipments - SUM(flag_delay)) / Total Shipments`
- **Related Columns**: `flag_delay`, `route_id`, `scan_timestamp`
- **Why It Matters**: Measures reliability of specific operational corridors to guarantee customer SLAs.
- **Update Frequency**: Daily

### Warehouse Dwell Efficiency
- **Formula**: `AVG(dwell_duration_min)`
- **Related Columns**: `dwell_duration_min`, `warehouse_id`, `queue_length`
- **Why It Matters**: Highlights warehouse transfer bottlenecks before they induce network-wide cascading delays.
- **Update Frequency**: Hourly

---

## Ambiguous Columns & Resolutions

### Column: flag_churn
- **Original Ambiguity**: Does it mean "currently churned" or "will churn in future"?
- **Resolved Meaning**: Binary indicator of whether customer churned within 90 days following severe delivery delays.
- **Business Interpretation**: Historical churn flag used for training predictive retention models.
- **Proposed Rename**: `has_churned_90d`
- **Risk If Misunderstood**: Models trained on wrong definition produce unreliable churn predictions and misallocate retention spend.

### Column: cust_segment
- **Original Ambiguity**: Is this market segment, customer segment, product segment, or geographic region?
- **Resolved Meaning**: Customer market segment (B2B, B2C, SMB) - determines SLA agreement terms and pricing tier.
- **Business Interpretation**: Informs go-to-market strategy, sales account management, and pricing models.
- **Proposed Rename**: `market_segment`
- **Risk If Misunderstood**: Revenue analysis by wrong dimension produces misleading segment performance metrics.

### Column: flag_cascade
- **Original Ambiguity**: Does it indicate an isolated single-leg delay or a multi-leg downstream propagation?
- **Resolved Meaning**: Binary indicator that an upstream route delay caused miss of downstream transfer window across connecting operational routes.
- **Business Interpretation**: Operational route risk metric for identifying network bottleneck routes.
- **Proposed Rename**: `is_cascading_delay`
- **Risk If Misunderstood**: Operations teams prioritize minor localized hub dwell times over critical network-wide propagation points.

### Column: trnx_amt
- **Original Ambiguity**: Is this gross booking fee, net revenue after delay penalties, or freight charge?
- **Resolved Meaning**: Gross transaction amount in USD prior to SLA delay penalty adjustments.
- **Business Interpretation**: Baseline revenue metric used for customer lifetime value and SLA financial impact modeling.
- **Proposed Rename**: `gross_transaction_usd`
- **Risk If Misunderstood**: Financial forecasts miscalculate net margin by omitting SLA breach penalty deductions.

---

## Column Relationships

### Revenue per Customer
- **Definition**: `SUM(trnx_amt) grouped by customer_id`
- **How It Matters**: Identifies high-value customers for retention focus, dedicated SLA monitoring, and upsell opportunities.
- **Example**: "Top 10% of customers generate 50% of revenue."
- **Related Columns**: `customer_id`, `trnx_amt`, `cust_segment`

### Churn by Segment  
- **Definition**: `SUM(flag_churn) / SUM(all customers) grouped by cust_segment`
- **How It Matters**: Identifies which customer segments experience highest churn risk following delivery delays, requiring targeted interventions.
- **Example**: "SMB segment has 25% churn vs 10% for B2B when cascading delays occur."
- **Related Columns**: `flag_churn`, `cust_segment`, `customer_id`

### Revenue Velocity
- **Definition**: Rolling sum of `trnx_amt` over 30-day windows.
- **How It Matters**: Tracks sales momentum, seasonality, and overall revenue growth trends.
- **Example**: "Monthly revenue velocity trending up 15% quarter-over-quarter."
- **Related Columns**: `trnx_amt`, `purchase_date`

### Cascading Delay Propagation by Route
- **Definition**: `SUM(flag_cascade) / COUNT(shipments) grouped by route_id & warehouse_id`
- **How It Matters**: Pinpoints exact operational routes and transfer hubs where high warehouse queue depths consistently trigger downstream multi-leg delays.
- **Example**: "Route ORD-JFK-04 exhibits a 34% cascading delay propagation rate when WH-ORD-01 queue length exceeds 300 packages."
- **Related Columns**: `flag_cascade`, `route_id`, `warehouse_id`, `dwell_duration_min`, `queue_length`
