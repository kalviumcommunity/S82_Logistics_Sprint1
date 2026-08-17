import pandas as pd
import numpy as np
import os

# ---------------------------------------------------------------------------
# Task 1 - Explicit Type Casting Function
# ---------------------------------------------------------------------------

def cast_columns_to_types(df, type_mapping):
    """
    Explicitly cast columns to correct dtypes.

    Args:
        df: Input DataFrame
        type_mapping: Dict of {column: target_dtype}

    Returns:
        DataFrame with corrected types and conversion log
    """
    df_typed = df.copy()
    conversion_log = {}

    for col, target_dtype in type_mapping.items():
        if col not in df.columns:
            print(f"  [WARN] Column '{col}' not found in DataFrame - skipping")
            continue

        original_dtype = str(df[col].dtype)
        try:
            df_typed[col] = df_typed[col].astype(target_dtype)
            conversion_log[col] = {
                'from': original_dtype,
                'to': str(target_dtype),
                'status': 'success'
            }
            print(f"  [OK] {col}: {original_dtype} -> {target_dtype}")
        except Exception as e:
            conversion_log[col] = {
                'from': original_dtype,
                'to': str(target_dtype),
                'status': 'failed',
                'error': str(e)
            }
            print(f"  [FAIL] {col}: Conversion failed - {e}")
            raise

    return df_typed, conversion_log


# ---------------------------------------------------------------------------
# Task 2 - Convert String Dates to Datetime (Always Explicit Format)
# ---------------------------------------------------------------------------

def convert_string_dates_to_datetime(df, date_columns, date_format=None):
    """
    Convert string columns to datetime with an explicit format.

    ALWAYS specify format. The string "01-02-2025" is ambiguous:
    MM-DD-YYYY (Jan 2) vs DD-MM-YYYY (Feb 1). Relying on pandas
    to infer the format causes silent data corruption that only
    surfaces when chronological sorting or grouping is attempted.

    Args:
        df: Input DataFrame
        date_columns: List of column names containing date strings
        date_format: Explicit format string e.g. '%Y-%m-%d'

    Returns:
        DataFrame with datetime columns
    """
    df_typed = df.copy()

    for col in date_columns:
        if col not in df.columns:
            print(f"  [WARN] Column '{col}' not found - skipping")
            continue

        original_dtype = str(df[col].dtype)
        try:
            if date_format:
                df_typed[col] = pd.to_datetime(df_typed[col], format=date_format)
            else:
                # Only use inference if absolutely necessary
                df_typed[col] = pd.to_datetime(df_typed[col])

            converted_type = str(df_typed[col].dtype)
            print(f"  [OK] {col}: {original_dtype} -> {converted_type} "
                  f"(format='{date_format}')")
        except Exception as e:
            print(f"  [FAIL] {col}: Conversion failed - {e}")
            print(f"         Sample values : {df[col].head(3).tolist()}")
            print(f"         Expected format: {date_format}")
            raise

    return df_typed


# ---------------------------------------------------------------------------
# Task 3 - Convert Currency Strings to Float
# ---------------------------------------------------------------------------

def convert_currency_to_float(df, currency_columns):
    """
    Strip currency symbols and convert to float.

    Example: '$150.50' -> 150.50

    Currency stored as text cannot be summed for revenue calculations.
    df['trnx_amt'].sum() on a string column silently concatenates strings
    instead of adding numbers, producing completely wrong totals.

    Args:
        df: Input DataFrame
        currency_columns: List of column names with currency strings

    Returns:
        DataFrame with clean numeric columns
    """
    df_typed = df.copy()

    for col in currency_columns:
        if col not in df.columns:
            print(f"  [WARN] Column '{col}' not found - skipping")
            continue

        original_dtype = str(df[col].dtype)
        original_nulls = int(df[col].isnull().sum())
        try:
            # Remove $, commas, whitespace
            df_typed[col] = (
                df_typed[col]
                .astype(str)
                .str.replace(r'[$,]', '', regex=True)
                .str.strip()
            )
            # errors='coerce' turns unconvertible values into NaN
            df_typed[col] = pd.to_numeric(df_typed[col], errors='coerce')

            # Warn if new NaNs appeared (values that could not be converted)
            new_nulls = int(df_typed[col].isnull().sum()) - original_nulls
            if new_nulls > 0:
                print(f"  [WARN] {col}: {new_nulls} value(s) could not be "
                      f"converted to numeric (set to NaN)")

            converted_type = str(df_typed[col].dtype)
            print(f"  [OK] {col}: {original_dtype} -> {converted_type} "
                  f"(stripped '$' and ',')")
        except Exception as e:
            print(f"  [FAIL] {col}: Conversion failed - {e}")
            raise

    return df_typed


# ---------------------------------------------------------------------------
# Task 4 - Convert Boolean-like Integers / Strings to bool
# ---------------------------------------------------------------------------

def convert_integers_to_boolean(df, boolean_columns):
    """
    Convert 0/1 integer or yes/no string columns to proper boolean type.

    Models expecting actual boolean type will reject integer 0/1.
    Logistic regression, decision trees, and most scikit-learn estimators
    treat 0 and 1 as numeric ordinals, not categorical flags, which
    changes the learned model weights silently.

    Args:
        df: Input DataFrame
        boolean_columns: List of column names with binary values

    Returns:
        DataFrame with bool-typed columns
    """
    df_typed = df.copy()

    STRING_BOOL_MAP = {
        'yes': True,   'no': False,
        'y':   True,   'n':  False,
        'true': True,  'false': False,
        '1':   True,   '0':  False,
        1:     True,   0:    False,
        True:  True,   False: False
    }

    for col in boolean_columns:
        if col not in df.columns:
            print(f"  [WARN] Column '{col}' not found - skipping")
            continue

        original_dtype = str(df[col].dtype)
        unique_vals = df[col].dropna().unique().tolist()
        print(f"         {col} unique values: {unique_vals}")
        try:
            if df[col].dtype == object:
                # String representations: map then cast
                df_typed[col] = df_typed[col].map(STRING_BOOL_MAP).astype(bool)
            else:
                # Numeric 0/1: direct cast
                df_typed[col] = df_typed[col].astype(bool)

            converted_type = str(df_typed[col].dtype)
            print(f"  [OK] {col}: {original_dtype} -> {converted_type} "
                  f"(0->False, 1->True)")
        except Exception as e:
            print(f"  [FAIL] {col}: Conversion failed - {e}")
            raise

    return df_typed


# ---------------------------------------------------------------------------
# Task 5 - Compare Before and After Dtypes
# ---------------------------------------------------------------------------

def compare_dtypes(df_original, df_typed):
    """
    Compare dtypes before and after conversion.

    Returns: Summary DataFrame of all type changes.
    """
    common_cols = [c for c in df_original.columns if c in df_typed.columns]

    comparison = pd.DataFrame({
        'column':       common_cols,
        'dtype_before': [str(df_original[c].dtype) for c in common_cols],
        'dtype_after':  [str(df_typed[c].dtype)    for c in common_cols],
        'changed':      [
            str(df_original[c].dtype) != str(df_typed[c].dtype)
            for c in common_cols
        ]
    })

    print("\n" + "=" * 70)
    print("DTYPE CONVERSION SUMMARY")
    print("=" * 70)
    print(comparison.to_string(index=False))

    os.makedirs('output', exist_ok=True)
    comparison.to_csv('output/dtype_conversion_report.csv', index=False)
    print("\nReport saved -> output/dtype_conversion_report.csv")
    print("=" * 70)

    return comparison


# ---------------------------------------------------------------------------
# Task 6 - Main Execution
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    # Load raw data (pandas reads all columns as strings by default)
    df = pd.read_csv('data/raw/untyped_data.csv')

    print("=" * 70)
    print("BEFORE TYPE CONVERSION")
    print("=" * 70)
    print(df.dtypes)
    print("\nSample data:")
    print(df.head(3).to_string())

    df_typed = df.copy()

    # --- 1. Convert date columns with explicit format ---
    print("\n1. Converting date columns...")
    df_typed = convert_string_dates_to_datetime(
        df_typed,
        date_columns=['scan_date', 'transfer_date'],
        date_format='%Y-%m-%d'   # explicit - no guessing
    )

    # --- 2. Convert currency columns ---
    print("\n2. Converting currency columns...")
    df_typed = convert_currency_to_float(
        df_typed,
        currency_columns=['trnx_amt', 'delay_cost']
    )

    # --- 3. Convert boolean-like integer columns ---
    print("\n3. Converting boolean columns...")
    df_typed = convert_integers_to_boolean(
        df_typed,
        boolean_columns=['flag_cascading_delay', 'is_priority_shipment']
    )

    # --- 4. Show after state ---
    print("\n" + "=" * 70)
    print("AFTER TYPE CONVERSION")
    print("=" * 70)
    print(df_typed.dtypes)
    print("\nSample data:")
    print(df_typed.head(3).to_string())

    # --- 5. Validation report ---
    compare_dtypes(df, df_typed)

    # --- 6. Save typed data ---
    os.makedirs('data/processed', exist_ok=True)
    df_typed.to_csv('data/processed/typed_data.csv', index=False)
    print("\n[OK] Typed data saved -> data/processed/typed_data.csv")
