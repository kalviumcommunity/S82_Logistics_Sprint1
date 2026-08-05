#!/usr/bin/env python3
"""
Large-Scale Logistics Telemetry Data Generator & Raw Extraction
================================================================
Generates 10,000+ raw logistics telemetry events with injected domain noise
(RFID duplicate pings, GPS anomalies, missing weather conditions, negative dwell times).

Outputs:
1. Temporary staging CSV file: `server/analytics/raw_staging_telemetry.csv`
2. MongoDB Collection: `raw_telemetry` (via pymongo)
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd
from faker import Faker

try:
    # pyrefly: ignore [missing-import]
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

# Ensure UTF-8 output encoding for console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

FACILITIES = [
    "HUB-CHICAGO", "HUB-DETROIT", "HUB-HOUSTON", "HUB-SEATTLE", "HUB-NEWYORK",
    "HUB-LOSANGELES", "HUB-ATLANTA", "HUB-MIAMI", "HUB-FRANKFURT", "HUB-MEMPHIS"
]

FACILITY_COORDS = {
    "HUB-CHICAGO": (41.8781, -87.6298),
    "HUB-DETROIT": (42.3314, -83.0458),
    "HUB-HOUSTON": (29.7604, -95.3698),
    "HUB-SEATTLE": (47.6062, -122.3321),
    "HUB-NEWYORK": (40.7128, -74.0060),
    "HUB-LOSANGELES": (34.0522, -118.2437),
    "HUB-ATLANTA": (33.7490, -84.3880),
    "HUB-MIAMI": (25.7617, -80.1918),
    "HUB-FRANKFURT": (50.1109, 8.6821),
    "HUB-MEMPHIS": (35.1495, -90.0490),
}

WEATHER_TYPES = ["CLEAR", "RAIN", "SNOW", "STORMY", "FOG"]


def generate_raw_data(num_records=10000):
    """Generates synthetic supply chain telemetry logs with injected domain noise."""
    print(f"[EXTRACT] Starting synthetic stream generator for {num_records} telemetry events...")

    shipment_ids = [f"SHIP-{10000 + i}" for i in range(2500)]
    records = []
    base_time = datetime.now(timezone.utc) - timedelta(days=7)

    for i in range(num_records):
        shipment_id = random.choice(shipment_ids)
        facility_id = random.choice(FACILITIES)
        scan_type = random.choice(["INBOUND", "OUTBOUND"])
        
        # Base timestamp with incremental offset
        event_time = base_time + timedelta(seconds=random.randint(0, 7 * 86400))
        timestamp_str = event_time.strftime('%Y-%m-%dT%H:%M:%S.000Z')

        # Dwell time in minutes
        dwell_time = round(float(np.random.gamma(shape=3.0, scale=25.0)), 2)

        # Capacity utilization (0.30 to 0.98)
        capacity_utilization = round(float(np.random.uniform(0.30, 0.98)), 4)

        # Weather condition
        weather = random.choice(WEATHER_TYPES)

        # GPS coordinates with minor variance around facility
        base_lat, base_lon = FACILITY_COORDS[facility_id]
        gps_lat = round(base_lat + float(np.random.normal(0, 0.05)), 6)
        gps_lon = round(base_lon + float(np.random.normal(0, 0.05)), 6)

        # Delay flag calculation (higher probability with severe weather / capacity > 0.8 / high dwell)
        delay_prob = 0.15
        if capacity_utilization > 0.80:
            delay_prob += 0.35
        if weather in ["STORMY", "SNOW"]:
            delay_prob += 0.25
        if dwell_time > 90.0:
            delay_prob += 0.20

        delay_flag = 1 if random.random() < min(delay_prob, 0.95) else 0

        record = {
            "shipment_id": shipment_id,
            "timestamp": timestamp_str,
            "facility_id": facility_id,
            "scan_type": scan_type,
            "dwell_time_mins": dwell_time,
            "facility_capacity_utilization": capacity_utilization,
            "weather_condition": weather,
            "gps_lat": gps_lat,
            "gps_lon": gps_lon,
            "delay_flag": delay_flag
        }
        records.append(record)

    # --- INJECT DOMAIN NOISE ---
    # 1) 3% Duplicate RFID scanner pings within a 5-second window
    num_dupes = int(num_records * 0.03)
    dupe_indices = random.sample(range(num_records), num_dupes)
    dupe_records = []
    for idx in dupe_indices:
        original = records[idx]
        dt = datetime.strptime(original["timestamp"], '%Y-%m-%dT%H:%M:%S.000Z')
        dupe_dt = dt + timedelta(seconds=random.randint(1, 4))
        dupe = dict(original)
        dupe["timestamp"] = dupe_dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        dupe_records.append(dupe)
    records.extend(dupe_records)

    # Shuffle dataset
    random.shuffle(records)

    # 2) 2% Invalid out-of-bounds GPS coordinates
    num_bad_gps = int(len(records) * 0.02)
    bad_gps_indices = random.sample(range(len(records)), num_bad_gps)
    for idx in bad_gps_indices:
        if random.random() < 0.5:
            records[idx]["gps_lat"] = round(random.choice([120.5, -145.2, 210.0, -99.9]), 6)
        else:
            records[idx]["gps_lon"] = round(random.choice([250.8, -310.4, 195.5, -200.0]), 6)

    # 3) 4% Missing weather conditions
    num_missing_weather = int(len(records) * 0.04)
    missing_weather_indices = random.sample(range(len(records)), num_missing_weather)
    for idx in missing_weather_indices:
        records[idx]["weather_condition"] = None

    # 4) 1.5% Negative dwell times
    num_neg_dwell = int(len(records) * 0.015)
    neg_dwell_indices = random.sample(range(len(records)), num_neg_dwell)
    for idx in neg_dwell_indices:
        records[idx]["dwell_time_mins"] = round(-1.0 * random.uniform(5.0, 45.0), 2)

    df = pd.DataFrame(records)
    return df


def save_staging_data(df):
    """Saves raw dataframe to local staging CSV and MongoDB `raw_telemetry` collection."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    staging_csv = os.path.join(script_dir, "raw_staging_telemetry.csv")

    df.to_csv(staging_csv, index=False)
    print(f"[EXTRACT] Saved {len(df)} raw telemetry records to temporary staging CSV: {staging_csv}")

    # Load into MongoDB `raw_telemetry` collection
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/logistics")
    db_name = os.getenv("MONGODB_DB", "logistics")

    if PYMONGO_AVAILABLE:
        try:
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            db = client[db_name]
            raw_coll = db["raw_telemetry"]
            raw_coll.delete_many({}) # Clear previous raw telemetry staging
            records_to_insert = df.to_dict(orient="records")
            raw_coll.insert_many(records_to_insert)
            print(f"[LOAD] Successfully dumped {len(records_to_insert)} raw records directly into MongoDB collection 'raw_telemetry'.")
        except Exception as e:
            print(f"[LOAD] MongoDB raw dump warning: {e}. Staging CSV remains saved at {staging_csv}.")
    else:
        print(f"[LOAD] PyMongo not available. Raw telemetry saved to staging CSV at {staging_csv}.")

    return staging_csv


if __name__ == "__main__":
    df_raw = generate_raw_data(10000)
    save_staging_data(df_raw)
