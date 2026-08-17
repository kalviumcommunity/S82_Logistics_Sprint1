"""
NumPy Vectorised Computation Workflow
======================================
Assignment 2.27 — Performance Optimizer

Problem Context (Logistics Domain)
------------------------------------
A logistics analyst needs to normalize dwell_duration_seconds and yard_queue_count
columns from the cascading_logistics_telemetry dataset (10,000+ rows) to identify
which operational routes consistently produce cascading delivery delays.

Loop-based processing on 100k rows takes ~45 seconds.
NumPy vectorization does the same in ~15ms — 3000x faster.

This script demonstrates:
  Task 1 — Min-Max Normalization (loop -> NumPy vectorized)
  Task 2 — Z-Score Normalization (NumPy vectorized)
  Task 3 — Bulk Ranking / Scoring (argsort-based ranking)
  Task 4 — Time Performance Comparison (loop vs NumPy)
  Task 5 — Integrate Results Back into DataFrame
"""

import numpy as np
import pandas as pd
import time

# Load logistics telemetry dataset
print("=" * 60)
print("NumPy Vectorised Computation - Logistics Telemetry")
print("=" * 60)

df = pd.read_csv("data/cascading_logistics_telemetry.csv")
print(f"\nDataset loaded: {df.shape[0]:,} rows x {df.shape[1]} columns")
print(f"Target columns: dwell_duration_seconds, yard_queue_count\n")

# Task 1: Replace Loop with NumPy Vectorization
# Min-Max Normalization of dwell_duration_seconds
print("-" * 60)
print("Task 1: Min-Max Normalization (Loop -> NumPy Vectorized)")
print("-" * 60)

# SLOW: Loop version
normalized_loop = []
for val in df["dwell_duration_seconds"]:
    normalized_loop.append(
        (val - df["dwell_duration_seconds"].min())
        / (df["dwell_duration_seconds"].max() - df["dwell_duration_seconds"].min())
    )

# FAST: NumPy vectorized version
dwell_array = df["dwell_duration_seconds"].values
normalized_np = (dwell_array - dwell_array.min()) / (dwell_array.max() - dwell_array.min())
df["dwell_normalized"] = normalized_np

print(f"  Loop result  (first 5): {[round(v, 4) for v in normalized_loop[:5]]}")
print(f"  NumPy result (first 5): {normalized_np[:5].round(4).tolist()}")
print(f"  Results match: {np.allclose(normalized_loop, normalized_np)}")
print(f"  Normalized range: [{normalized_np.min():.4f}, {normalized_np.max():.4f}]  (expected: [0, 1])\n")

# Task 2: Z-Score Normalization
print("-" * 60)
print("Task 2: Z-Score Normalization (NumPy Vectorized)")
print("-" * 60)

dwell_array = df["dwell_duration_seconds"].values
z_scores = (dwell_array - dwell_array.mean()) / dwell_array.std()
df["dwell_zscore"] = z_scores

print(f"  Mean of z-scores  : {z_scores.mean():.6f}  (expected: ~0)")
print(f"  StdDev of z-scores: {z_scores.std():.6f}   (expected: ~1)")
print(f"  First 5 z-scores  : {z_scores[:5].round(4).tolist()}")
print(f"  High-delay events (z > 2): {(z_scores > 2).sum():,} shipments\n")

# Task 3: Bulk Ranking / Scoring
print("-" * 60)
print("Task 3: Bulk Ranking / Scoring (NumPy argsort)")
print("-" * 60)

dwell_array = df["dwell_duration_seconds"].values
rankings = np.argsort(-dwell_array)
rank_array = np.empty_like(rankings)
rank_array[rankings] = np.arange(1, len(rankings) + 1)
df["dwell_rank"] = rank_array

yard_array = df["yard_queue_count"].values
yard_normalized = (yard_array - yard_array.min()) / (yard_array.max() - yard_array.min())
delay_risk_score = 0.6 * normalized_np + 0.4 * yard_normalized
df["delay_risk_score"] = delay_risk_score

print(f"  Rank 1 (longest dwell): {dwell_array.max():,} seconds")
print(f"  Rank {len(rankings):,} (shortest dwell): {dwell_array.min():,} seconds")
print(f"  Delay risk score range: [{delay_risk_score.min():.4f}, {delay_risk_score.max():.4f}]\n")

# Task 4: Time Performance Comparison
print("-" * 60)
print("Task 4: Time Performance Comparison (Loop vs NumPy)")
print("-" * 60)

start = time.time()
result_loop = []
for val in df["dwell_duration_seconds"]:
    result_loop.append(val * 1.1)
loop_time = time.time() - start

start = time.time()
result_np = df["dwell_duration_seconds"].values * 1.1
np_time = time.time() - start

speedup = loop_time / np_time if np_time > 0 else float("inf")
print(f"  Loop time : {loop_time:.4f}s")
print(f"  NumPy time: {np_time:.4f}s")
print(f"  Speedup   : {speedup:.0f}x faster with NumPy")
print(f"  Results match: {np.allclose(result_loop, result_np)}\n")

# Task 5: Integrate Results Back to DataFrame
print("-" * 60)
print("Task 5: Integrate NumPy Results into DataFrame")
print("-" * 60)

df["dwell_normalized"]  = normalized_np
df["dwell_zscore"]      = z_scores
df["dwell_rank"]        = rank_array
df["delay_risk_score"]  = delay_risk_score

print(f"  DataFrame shape : {df.shape}")
print(f"\n  New column dtypes:")
new_cols = ["dwell_normalized", "dwell_zscore", "dwell_rank", "delay_risk_score"]
for col in new_cols:
    print(f"    {col}: {df[col].dtype}")

print(f"\n  Sample output (first 5 rows):")
print(df[["shipment_id", "dwell_duration_seconds"] + new_cols].head(5).to_string(index=False))

output_path = "data/processed/logistics_vectorized_features.csv"
df.to_csv(output_path, index=False)
print(f"\n  Enriched dataset saved to: {output_path}")

print("\n" + "=" * 60)
print("Summary")
print("=" * 60)
print(f"  Rows processed            : {len(df):,}")
print(f"  Loop vs NumPy speedup     : {speedup:.0f}x")
print(f"  High-delay events (z > 2) : {(z_scores > 2).sum():,} shipments")
print(f"  Features added            : {len(new_cols)}")
