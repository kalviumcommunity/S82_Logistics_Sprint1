import pandas as pd
import numpy as np
import json
import os
from datetime import datetime


# ---------------------------------------------------------------------------
# Task 1 - Detect Exact Duplicates
# ---------------------------------------------------------------------------

def detect_exact_duplicates(df):
    """
    Find rows where ALL values are identical.

    Returns: Tuple of (count, duplicate_rows_dataframe)
    """
    exact_dups = df.duplicated().sum()
    # keep=False marks EVERY member of a duplicate group
    dup_rows = df[df.duplicated(keep=False)].sort_values(
        by=df.columns.tolist()
    )

    print("\nEXACT DUPLICATE DETECTION")
    print("=" * 60)
    print(f"Exact duplicates found      : {exact_dups}")
    print(f"Rows involved (incl. orig.) : {len(dup_rows)}")

    if len(dup_rows) > 0:
        print("\nSample duplicate rows:")
        print(dup_rows.head(10).to_string())

    return exact_dups, dup_rows


# ---------------------------------------------------------------------------
# Task 2 - Detect Near-Duplicates Using Key Columns
# ---------------------------------------------------------------------------

def detect_near_duplicates(df, key_columns):
    """
    Find rows with the same key values but different other fields.
    These are the same real-world event recorded more than once with
    slight differences (one record complete, another partially missing).

    Args:
        df: Input DataFrame
        key_columns: Columns that together define a unique event
                     e.g. ['shipment_id', 'scan_timestamp']

    Returns: DataFrame showing all near-duplicate groups
    """
    duplicate_keys = df[df.duplicated(subset=key_columns, keep=False)]

    print("\nNEAR-DUPLICATE DETECTION")
    print("=" * 60)
    print(f"Records with duplicate keys          : {len(duplicate_keys)}")
    print(f"Unique key combos with duplicates    : "
          f"{len(duplicate_keys.groupby(key_columns))}")

    if len(duplicate_keys) > 0:
        print("\nSample groups with duplicate keys:")
        for keys, group in list(duplicate_keys.groupby(key_columns))[:3]:
            print(f"\n  Key: {keys}")
            print(f"  Records in group: {len(group)}")
            print(group.to_string())

    return duplicate_keys


# ---------------------------------------------------------------------------
# Task 3 - Remove Exact Duplicates With Keep Strategy
# ---------------------------------------------------------------------------

def remove_exact_duplicates(df, keep='first'):
    """
    Remove exact duplicates, choosing which record to keep.

    Args:
        df:   Input DataFrame
        keep: 'first'  - keep earliest occurrence (most trustworthy source)
              'last'   - keep most recent (best for corrective re-imports)
              False    - remove every member of a duplicate group

    Returns: Deduplicated DataFrame
    """
    rows_before = len(df)
    df_dedup = df.drop_duplicates(keep=keep)
    rows_after   = len(df_dedup)
    rows_removed = rows_before - rows_after
    removal_pct  = (rows_removed / rows_before) * 100

    print("\nEXACT DUPLICATE REMOVAL")
    print("=" * 60)
    print(f"Keep strategy : {keep}")
    print(f"Rows before   : {rows_before:,}")
    print(f"Rows after    : {rows_after:,}")
    print(f"Rows removed  : {rows_removed:,} ({removal_pct:.2f}%)")

    return df_dedup


# ---------------------------------------------------------------------------
# Task 4 - Remove Near-Duplicates With Custom Logic
# ---------------------------------------------------------------------------

def remove_near_duplicates(df, key_columns, keep_strategy='most_complete'):
    """
    Remove near-duplicates by choosing the best record per key group.

    Strategy options:
      'most_complete' - keep the row with the fewest null values.
                        Best when multiple sources each have partial data.
      'first'         - keep the earliest record by index.
      'last'          - keep the most recent record by index.

    Args:
        df: Input DataFrame (exact duplicates should already be removed)
        key_columns: Columns that together define one real-world event
        keep_strategy: Which record to preserve per duplicate group

    Returns: Deduplicated DataFrame (original indices preserved)
    """
    rows_before = len(df)

    if keep_strategy == 'most_complete':
        # Sort so the record with fewest nulls sorts first, then keep first per key.
        # Avoids groupby().apply() deprecation issues in pandas >= 2.2.
        df_work = df.copy()
        df_work['_null_count'] = df_work.isnull().sum(axis=1)
        df_work = df_work.sort_values('_null_count')     # fewest nulls first
        df_dedup = df_work.drop_duplicates(subset=key_columns, keep='first')
        df_dedup = df_dedup.drop(columns=['_null_count'])
    elif keep_strategy == 'last':
        df_dedup = df.drop_duplicates(subset=key_columns, keep='last')
    else:
        df_dedup = df.drop_duplicates(subset=key_columns, keep='first')

    rows_after   = len(df_dedup)
    rows_removed = rows_before - rows_after
    removal_pct  = (rows_removed / rows_before) * 100

    print("\nNEAR-DUPLICATE REMOVAL")
    print("=" * 60)
    print(f"Keep strategy : {keep_strategy}")
    print(f"Key columns   : {key_columns}")
    print(f"Rows before   : {rows_before:,}")
    print(f"Rows after    : {rows_after:,}")
    print(f"Rows removed  : {rows_removed:,} ({removal_pct:.2f}%)")

    return df_dedup


# ---------------------------------------------------------------------------
# Task 5 - Log Removed Records for Audit
# ---------------------------------------------------------------------------

def log_removed_duplicates(df_original, df_dedup):
    """
    Save every removed duplicate row to an audit CSV for compliance.
    Answers: "Where did that record go?" with certainty.

    Uses pandas row hashing so the comparison is safe even when indices
    have been reset after sorting or groupby operations.

    Returns: Tuple of (removed_records_df, audit_summary_dict)
    """
    orig_hashes  = pd.util.hash_pandas_object(df_original, index=False)
    dedup_hashes = pd.util.hash_pandas_object(df_dedup,    index=False)
    kept_hashes  = set(dedup_hashes.values)
    removed_mask = ~orig_hashes.isin(kept_hashes)
    removed_records = df_original[removed_mask].copy()

    print("\nAUDIT LOGGING")
    print("=" * 60)
    print(f"Total records removed : {len(removed_records)}")

    os.makedirs('output', exist_ok=True)
    removed_records.to_csv('output/removed_duplicates_audit.csv', index=False)
    print("[OK] Removed records -> output/removed_duplicates_audit.csv")

    audit_summary = {
        'removal_timestamp': datetime.now().isoformat(),
        'total_removed': int(len(removed_records)),
        'reason': 'Duplicate detection and deduplication',
        'audit_file': 'output/removed_duplicates_audit.csv',
        'audit_note': (
            'All removed records are logged here for compliance and '
            'recovery if a record was incorrectly flagged as a duplicate.'
        )
    }

    with open('output/dedup_audit_summary.json', 'w') as f:
        json.dump(audit_summary, f, indent=2, default=str)
    print("[OK] Audit summary    -> output/dedup_audit_summary.json")
    print("=" * 60)

    return removed_records, audit_summary


# ---------------------------------------------------------------------------
# Task 6 - Compare Before and After
# ---------------------------------------------------------------------------

def compare_before_after(df_original, df_dedup):
    """
    Log before/after metrics confirming deduplication worked.

    Returns: Comparison dictionary
    """
    rows_removed = len(df_original) - len(df_dedup)
    removal_pct  = round((rows_removed / len(df_original)) * 100, 2)

    comparison = {
        'rows_before':        len(df_original),
        'rows_after':         len(df_dedup),
        'rows_removed':       rows_removed,
        'removal_percentage': removal_pct,
        'columns':            len(df_original.columns),
        'nulls_before':       int(df_original.isnull().sum().sum()),
        'nulls_after':        int(df_dedup.isnull().sum().sum()),
        'timestamp':          datetime.now().isoformat()
    }

    print("\n" + "=" * 70)
    print("DEDUPLICATION FINAL SUMMARY")
    print("=" * 70)
    print(f"Rows before     : {comparison['rows_before']:,}")
    print(f"Rows after      : {comparison['rows_after']:,}")
    print(f"Removed         : {comparison['rows_removed']:,} "
          f"({comparison['removal_percentage']}%)")
    print(f"\nNulls before    : {comparison['nulls_before']:,}")
    print(f"Nulls after     : {comparison['nulls_after']:,}")
    print(f"Null reduction  : "
          f"{comparison['nulls_before'] - comparison['nulls_after']:,}")
    print("=" * 70)

    with open('output/dedup_summary.json', 'w') as f:
        json.dump(comparison, f, indent=2)
    print("[OK] Summary -> output/dedup_summary.json")

    return comparison


# ---------------------------------------------------------------------------
# Task 7 - Main Deduplication Workflow
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    df = pd.read_csv('data/raw/data_with_dupes.csv')
    df_original = df.copy()

    print("\n" + "=" * 70)
    print("STARTING DEDUPLICATION WORKFLOW")
    print("=" * 70)
    print(f"Initial record count: {len(df):,}")
    print(df.to_string())

    # Step 1: Detect exact duplicates
    print("\n[Step 1/4] Detecting exact duplicates...")
    exact_count, exact_rows = detect_exact_duplicates(df)

    # Step 2: Detect near-duplicates by key
    print("\n[Step 2/4] Detecting near-duplicates by key columns...")
    near_dups = detect_near_duplicates(
        df,
        key_columns=['shipment_id', 'scan_timestamp']
    )

    # Step 3: Remove exact duplicates first
    print("\n[Step 3/4] Removing exact duplicates (keep='first')...")
    df_dedup = remove_exact_duplicates(df, keep='first')

    # Step 4: Remove near-duplicates keeping most complete record
    print("\n[Step 4/4] Removing near-duplicates (keep='most_complete')...")
    df_dedup = remove_near_duplicates(
        df_dedup,
        key_columns=['shipment_id', 'scan_timestamp'],
        keep_strategy='most_complete'
    )

    # Audit: log all removed records
    print("\n[Audit] Logging removed records for compliance...")
    removed_records, audit = log_removed_duplicates(df_original, df_dedup)

    # Final comparison
    compare_before_after(df_original, df_dedup)

    # Save clean data
    os.makedirs('data/processed', exist_ok=True)
    df_dedup.to_csv('data/processed/deduplicated_data.csv', index=False)
    print("\n[OK] Deduplicated data -> data/processed/deduplicated_data.csv")
