import os
import sys
import time
import numpy as np
import pandas as pd

# Ensure UTF-8 output encoding for Windows environment
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def run_vectorization_pipeline():
    print("=" * 80)
    print("LOGISTICS OPERATIONAL ROUTE REVENUE & DELAY VECTORIZATION PIPELINE")
    print("=" * 80)

    # Generate or load synthetic dataset of 100,000 logistics shipment routes with revenue & delay metrics
    np.random.seed(42)
    n_rows = 100000

    print(f"\n[INIT] Generating dataset with {n_rows:,} shipment route records...")
    df = pd.DataFrame({
        'shipment_id': [f"LGS-SHP-{i:07d}" for i in range(1, n_rows + 1)],
        'route_id': np.random.choice(['CHI-DET', 'NY-BOS', 'LA-PHX', 'MIA-ATL', 'SEA-PDX'], size=n_rows),
        'revenue': np.random.uniform(50.0, 5000.0, size=n_rows),
        'delay_minutes': np.random.exponential(scale=35.0, size=n_rows),
    })

    # =========================================================================
    # Task 1: Replace Loop with NumPy Vectorization
    # =========================================================================
    print("\n" + "-" * 60)
    print("TASK 1: Min-Max Normalization (NumPy Vectorization vs Loop)")
    print("-" * 60)

    # SLOW: Python Loop Min-Max Normalization
    start_loop = time.time()
    min_rev_loop = df['revenue'].min()
    max_rev_loop = df['revenue'].max()
    diff_rev_loop = max_rev_loop - min_rev_loop
    normalized_loop = []
    for val in df['revenue']:
        normalized_loop.append((val - min_rev_loop) / diff_rev_loop)
    time_loop_norm = time.time() - start_loop

    # FAST: NumPy Vectorized Min-Max Normalization
    start_np = time.time()
    revenue_array = df['revenue'].values
    normalized_np = (revenue_array - revenue_array.min()) / (revenue_array.max() - revenue_array.min())
    df['revenue_normalized'] = normalized_np
    time_np_norm = time.time() - start_np

    print(f"Loop Normalization Time : {time_loop_norm:.4f}s")
    print(f"NumPy Normalization Time: {time_np_norm:.6f}s")
    if time_np_norm > 0:
        print(f"Vectorization Speedup  : {time_loop_norm / time_np_norm:.0f}x faster")
    print(f"Sample Normalized Values: {normalized_np[:5]}")

    # =========================================================================
    # Task 2: Z-Score Normalization
    # =========================================================================
    print("\n" + "-" * 60)
    print("TASK 2: Z-Score Normalization")
    print("-" * 60)

    revenue_array = df['revenue'].values
    z_scores = (revenue_array - revenue_array.mean()) / revenue_array.std()
    df['revenue_zscore'] = z_scores

    print(f"Z-Score Mean (Target ~0.0): {z_scores.mean():.6f}")
    print(f"Z-Score Std  (Target ~1.0): {z_scores.std():.6f}")
    print(f"Sample Z-Scores          : {z_scores[:5]}")

    # =========================================================================
    # Task 3: Bulk Ranking / Scoring
    # =========================================================================
    print("\n" + "-" * 60)
    print("TASK 3: Bulk Ranking / Scoring")
    print("-" * 60)

    # Rank all shipments/customers by revenue (Descending)
    revenue_array = df['revenue'].values
    rankings = np.argsort(-revenue_array)  # Negative for descending rank order
    revenue_rank = np.empty_like(rankings)
    revenue_rank[rankings] = np.arange(1, len(rankings) + 1)
    df['revenue_rank'] = revenue_rank

    print("Top 5 Highest Revenue Shipments Ranking Verification:")
    print(df[['shipment_id', 'revenue', 'revenue_rank']].sort_values('revenue_rank').head(5).to_string(index=False))

    # =========================================================================
    # Task 4: Time Performance Comparison
    # =========================================================================
    print("\n" + "-" * 60)
    print("TASK 4: Time Performance Comparison (10% Price Adjustment Operation)")
    print("-" * 60)

    # Time loop version
    start = time.time()
    result_loop = []
    for val in df['revenue']:
        result_loop.append(val * 1.1)
    loop_time = time.time() - start

    # Time NumPy version
    start = time.time()
    result_np = df['revenue'].values * 1.1
    np_time = time.time() - start

    print(f"Loop : {loop_time:.4f}s")
    print(f"NumPy: {np_time:.6f}s")
    if np_time > 0:
        print(f"Speedup: {loop_time / np_time:.0f}x")

    # =========================================================================
    # Task 5: Integrate Back to DataFrame & Verification
    # =========================================================================
    print("\n" + "-" * 60)
    print("TASK 5: Integrate Back to DataFrame & Data Integrity Check")
    print("-" * 60)

    # All NumPy results integrated back into DataFrame as new columns
    df['revenue_normalized'] = normalized_np
    df['revenue_zscore'] = z_scores
    df['revenue_rank'] = revenue_rank

    # Verify types and shapes
    print(f"Shape: {df.shape}")
    print(f"\nDtypes:\n{df.dtypes}")

    print("\nSample Output (First 5 Rows):")
    print(df.head(5).to_string(index=False))

    # Export processed output
    os.makedirs('data/processed', exist_ok=True)
    out_path = 'data/processed/vectorized_revenue_normalized.csv'
    df.to_csv(out_path, index=False)
    print(f"\n[SUCCESS] Vectorized normalization complete. Results exported to: {out_path}")


if __name__ == '__main__':
    run_vectorization_pipeline()
