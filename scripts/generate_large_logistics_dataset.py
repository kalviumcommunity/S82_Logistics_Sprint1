import os
import sys
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Ensure stdout uses UTF-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

np.random.seed(42)
random.seed(42)

os.makedirs('data/raw', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)
os.makedirs('output', exist_ok=True)

print("=" * 80)
print("GENERATING LARGE-SCALE LOGISTICS TELEMETRY & OPERATIONS DATASETS")
print("Target Volume: 10,000+ Records Per Pipeline Stage")
print("Aligned with AGENTS.md Problem Statement: Cascading Delivery Delays & Route Telemetry")
print("=" * 80)

n_records = 10000

# -------------------------------------------------------------------------
# 1. Primary Cascading Logistics Telemetry Dataset (10,000 shipment scan events)
# -------------------------------------------------------------------------
hubs = ['HUB-CHICAGO', 'HUB-DETROIT', 'HUB-FRANKFURT', 'HUB-SINGAPORE', 'HUB-SEATTLE',
        'HUB-MEMPHIS', 'HUB-NEWYORK', 'HUB-MIAMI', 'HUB-LOSANGELES', 'HUB-ATLANTA', 'HUB-HOUSTON']
scan_types = ['HUB_INGEST', 'WAYPOINT_SCAN', 'TRANSFER_ARRIVE', 'YARD_DEPARTURE', 'CUSTOMS_CLEARANCE']
carriers = ['CR-FEDEX', 'CR-DHL', 'CR-UPS', 'CR-USPS', 'CR-MAERSK']
weathers = ['CLEAR', 'MODERATE', 'HEAVY_RAIN', 'SNOWSTORM', 'FOG']
traffic_levels = ['LOW', 'MODERATE', 'HEAVY', 'SEVERE_GRIDLOCK']

start_date = datetime(2026, 8, 1, 0, 0, 0)
event_timestamps = [start_date + timedelta(seconds=int(i * 30 + np.random.randint(-10, 10))) for i in range(n_records)]
sla_deadlines = [ts + timedelta(hours=int(np.random.choice([24, 36, 48, 72]))) for ts in event_timestamps]

origin_hubs = np.random.choice(hubs, size=n_records)
current_facilities = [hubs[(hubs.index(o) + np.random.randint(0, 3)) % len(hubs)] for o in origin_hubs]
destination_hubs = [hubs[(hubs.index(o) + np.random.randint(3, 7)) % len(hubs)] for o in origin_hubs]

dwell_baselines = np.random.choice([2400, 3600, 4800], size=n_records)
dwell_durations = dwell_baselines + np.random.normal(loc=600, scale=1200, size=n_records).astype(int)
dwell_durations = np.clip(dwell_durations, 300, 250000)

telemetry_df = pd.DataFrame({
    'event_id': [f"EV-{i+10000:06d}" for i in range(n_records)],
    'shipment_id': [f"LGS-{(i % 2500)+1000:04d}-ROUTE" for i in range(n_records)],
    'origin_hub': origin_hubs,
    'current_facility': current_facilities,
    'destination_hub': destination_hubs,
    'event_timestamp': [ts.isoformat() + 'Z' for ts in event_timestamps],
    'scan_type': np.random.choice(scan_types, size=n_records),
    'actual_dwell': dwell_durations,
    'average_dwell': dwell_baselines,
    'dwell_duration_seconds': dwell_durations,
    'avg_dwell_baseline_seconds': dwell_baselines,
    'yard_queue_count': np.random.randint(1, 30, size=n_records),
    'yard_max_capacity': 30,
    'weather_condition': np.random.choice(weathers, size=n_records, p=[0.6, 0.2, 0.1, 0.05, 0.05]),
    'weather_exception': np.random.choice([True, False], size=n_records, p=[0.15, 0.85]),
    'traffic_congestion_level': np.random.choice(traffic_levels, size=n_records, p=[0.5, 0.3, 0.15, 0.05]),
    'gps_latitude': np.random.uniform(25.0, 52.0, size=n_records).round(4),
    'gps_longitude': np.random.uniform(-125.0, 10.0, size=n_records).round(4),
    'sla_deadline_timestamp': [ts.isoformat() + 'Z' for ts in sla_deadlines],
    'carrier_id': np.random.choice(carriers, size=n_records)
})

telemetry_df.to_csv('data/cascading_logistics_telemetry.csv', index=False)
telemetry_df.to_csv('data/raw/cascading_logistics_telemetry.csv', index=False)
print(f"✓ Created primary telemetry dataset: 10,000 records -> data/cascading_logistics_telemetry.csv")

# -------------------------------------------------------------------------
# 2. Raw Missing Data Dataset for Imputation Pipelines (10,000 records)
# -------------------------------------------------------------------------
missing_df = pd.DataFrame({
    'customer_id': [f"CUST-{i:05d}" if np.random.rand() > 0.02 else None for i in range(n_records)],
    'email': [f"user_{i}@logistics-domain.com" if np.random.rand() > 0.03 else None for i in range(n_records)],
    'amount': [np.random.uniform(50, 5000) if np.random.rand() > 0.05 else np.nan for i in range(n_records)],
    'quantity': [np.random.randint(1, 100) if np.random.rand() > 0.04 else np.nan for i in range(n_records)],
    'category': [np.random.choice(['Freight Express', 'Priority Direct', 'Standard Ground']) if np.random.rand() > 0.05 else None for i in range(n_records)],
    'region': [np.random.choice(['North America', 'Europe', 'Asia Pacific']) if np.random.rand() > 0.03 else None for i in range(n_records)],
    'warehouse_id': [np.random.choice(['WH-ORD', 'WH-DET', 'WH-MIA', 'WH-LAX']) if np.random.rand() > 0.06 else None for i in range(n_records)],
    'dwell_duration_min': [np.random.normal(60, 15) if np.random.rand() > 0.08 else np.nan for i in range(n_records)],
    'status_date': [start_date + timedelta(minutes=i) if np.random.rand() > 0.04 else None for i in range(n_records)],
    'delay_reason_code': [np.random.choice(['WEATHER_DELAY', 'YARD_CONGESTION', 'CUSTOMS_HOLD', 'EQUIPMENT_FAIL']) if np.random.rand() > 0.10 else None for i in range(n_records)]
})

missing_df.to_csv('data/raw/raw_data.csv', index=False)
missing_df.to_csv('data/raw/missing_data.csv', index=False)
print(f"✓ Created raw missing values dataset: 10,000 records -> data/raw/raw_data.csv")

# -------------------------------------------------------------------------
# 3. Customer Activity Dataset for Feature Engineering (10,000 records)
# -------------------------------------------------------------------------
days_as_cust = np.random.randint(30, 1000, size=n_records)
total_tx = np.random.randint(1, 150, size=n_records)

customer_activity_df = pd.DataFrame({
    'customer_id': [f"CUST-ACT-{i:05d}" for i in range(n_records)],
    'total_transactions': total_tx,
    'purchase_count': total_tx,
    'days_as_customer': days_as_cust,
    'days_since_last_purchase': np.random.randint(1, 180, size=n_records),
    'total_spent': np.random.uniform(500, 75000, size=n_records).round(2)
})

customer_activity_df.to_csv('data/raw/customer_activity_data.csv', index=False)
print(f"✓ Created customer activity dataset: 10,000 records -> data/raw/customer_activity_data.csv")

# -------------------------------------------------------------------------
# 4. Datetime Transaction Dataset (10,000 records)
# -------------------------------------------------------------------------
dt_records = pd.DataFrame({
    'transaction_date': [(start_date + timedelta(minutes=i * 3 + np.random.randint(0, 5))).strftime('%Y-%m-%d %H:%M:%S') for i in range(n_records)],
    'customer_id': [f"CUST-DT-{(i % 2000)+1:04d}" for i in range(n_records)],
    'amount': np.random.uniform(50, 4500, size=n_records).round(2)
})

dt_records.to_csv('data/raw/datetime_transaction_data.csv', index=False)
print(f"✓ Created datetime transaction dataset: 10,000 records -> data/raw/datetime_transaction_data.csv")

# -------------------------------------------------------------------------
# 5. Untyped Dataset for Type Enforcement (10,000 records)
# -------------------------------------------------------------------------
untyped_df = pd.DataFrame({
    'transaction_date': [(start_date + timedelta(days=i % 30)).strftime('%Y-%m-%d') for i in range(n_records)],
    'signup_date': [(start_date - timedelta(days=np.random.randint(30, 365))).strftime('%Y-%m-%d') for i in range(n_records)],
    'amount': [f"${np.random.uniform(50, 3500):,.2f}" for _ in range(n_records)],
    'revenue': [f"${np.random.uniform(100, 10000):,.2f}" for _ in range(n_records)],
    'is_active': np.random.choice(['yes', 'no'], size=n_records),
    'is_premium': np.random.choice(['1', '0'], size=n_records)
})

untyped_df.to_csv('data/raw/untyped_data.csv', index=False)
print(f"✓ Created untyped dataset: 10,000 records -> data/raw/untyped_data.csv")

# -------------------------------------------------------------------------
# 6. Validation Dataset for Quality Audits (10,000 records)
# -------------------------------------------------------------------------
val_ages = np.random.randint(18, 75, size=n_records)
for i in range(0, n_records, 100):
    val_ages[i] = -5
for i in range(0, n_records, 150):
    val_ages[i] = 200

val_prices = np.random.uniform(10, 2000, size=n_records).round(2)
for i in range(0, n_records, 120):
    val_prices[i] = -50.0

emails = [f"shipper_{i}@freight.com" for i in range(n_records)]
for i in range(0, n_records, 90):
    emails[i] = "invalid_email_at_domain.com"
for i in range(0, n_records, 200):
    emails[i] = None

phones = [f"{random.randint(1000000000, 9999999999)}" for i in range(n_records)]
for i in range(0, n_records, 80):
    phones[i] = "12345"

start_dates = [start_date + timedelta(days=np.random.randint(0, 30)) for _ in range(n_records)]
end_dates = [sd + timedelta(days=np.random.randint(1, 10)) for sd in start_dates]

validation_df = pd.DataFrame({
    'customer_id': [f"CUST-VAL-{i:05d}" if i % 180 != 0 else None for i in range(n_records)],
    'age': val_ages,
    'price': val_prices,
    'birth_date': '1988-05-14',
    'email': emails,
    'phone': phones,
    'start_date': [sd.strftime('%Y-%m-%d') for sd in start_dates],
    'end_date': [ed.strftime('%Y-%m-%d') for ed in end_dates]
})

validation_df.to_csv('data/raw/validation_data.csv', index=False)
print(f"✓ Created validation dataset: 10,000 records -> data/raw/validation_data.csv")

# -------------------------------------------------------------------------
# 7. Dataset with Duplicates for Deduplication Pipelines (10,000 records)
# -------------------------------------------------------------------------
base_dedup = pd.DataFrame({
    'customer_id': [f"CUST-DUP-{(i % 4500)+1:04d}" for i in range(9000)],
    'transaction_date': [(start_date + timedelta(hours=i % 500)).strftime('%Y-%m-%d') for i in range(9000)],
    'amount': np.random.uniform(100, 1500, size=9000).round(2),
    'status': np.random.choice(['COMPLETED', 'PENDING', 'CANCELLED'], size=9000)
})

exact_dupes = base_dedup.iloc[:1000].copy()
dedup_df = pd.concat([base_dedup, exact_dupes], ignore_index=True)

dedup_df.to_csv('data/raw/data_with_dupes.csv', index=False)
print(f"✓ Created duplicate dataset: 10,000 records -> data/raw/data_with_dupes.csv")

# -------------------------------------------------------------------------
# 8. Orders & Customers Master Tables for Relational Joins (10,000 records)
# -------------------------------------------------------------------------
orders_df = pd.DataFrame({
    'order_id': [f"ORD-{(i+1):05d}" for i in range(n_records)],
    'customer_id': [f"CUST-JOIN-{(i % 7500)+1:04d}" for i in range(n_records)],
    'order_date': [(start_date + timedelta(hours=i % 1000)).strftime('%Y-%m-%d') for i in range(n_records)],
    'amount': np.random.uniform(200, 8000, size=n_records).round(2),
    'warehouse_id': np.random.choice(['WH-CHICAGO', 'WH-DETROIT', 'WH-NEWYORK', 'WH-MIAMI'], size=n_records)
})

customers_df = pd.DataFrame({
    'customer_id': [f"CUST-JOIN-{i:04d}" for i in range(1, 8001)],
    'customer_name': [f"Freight Account {i}" for i in range(1, 8001)],
    'region': np.random.choice(['North America', 'Europe', 'Asia Pacific'], size=8000),
    'segment': np.random.choice(['Enterprise', 'SMB', 'Startup'], size=8000, p=[0.1, 0.4, 0.5])
})

orders_df.to_csv('data/raw/orders.csv', index=False)
customers_df.to_csv('data/raw/customers.csv', index=False)
print(f"✓ Created relational orders & customers datasets: 10,000 orders & 8,000 customer master records")

print("=" * 80)
print("ALL LARGE-SCALE LOGISTICS DATASETS GENERATED SUCCESSFULLY")
print("=" * 80)
