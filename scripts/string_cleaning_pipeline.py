import os
import sys
import pandas as pd
import numpy as np

# Ensure stdout uses UTF-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def strip_all_strings(df):
    """
    Task 1: Strip whitespace from all string columns.
    Document which columns were cleaned and how many values had whitespace.
    """
    df_cleaned = df.copy()
    string_cols = df_cleaned.select_dtypes(include=['object']).columns
    
    print("\n" + "="*60)
    print("TASK 1: STRIP WHITESPACE CONSISTENTLY")
    print("="*60)
    
    total_issues_fixed = 0
    for col in string_cols:
        before_unique = df_cleaned[col].nunique()
        whitespace_mask = df_cleaned[col].dropna().astype(str).str.contains(r'^\s|\s$', regex=True)
        whitespace_count = int(whitespace_mask.sum())
        total_issues_fixed += whitespace_count
        
        # Show value counts before for demonstration
        print(f"\n--- Column: {col} ---")
        print("Value counts before strip:")
        print(df_cleaned[col].value_counts().to_string())
        
        # Apply strip
        df_cleaned[col] = df_cleaned[col].str.strip()
        
        after_unique = df_cleaned[col].nunique()
        print(f"Value counts after strip:")
        print(df_cleaned[col].value_counts().to_string())
        print(f"Result: {col}: {before_unique} → {after_unique} unique values (Fixed {whitespace_count} whitespace issues)")
    
    print("\n" + "-"*60)
    print(f"Summary: Total whitespace issues fixed across dataset: {total_issues_fixed}")
    print("-"*60)
    
    return df_cleaned


def normalize_casing(df, columns_to_lower):
    """
    Task 2: Normalize casing for specified columns to a consistent standard.
    """
    df_cleaned = df.copy()
    print("\n" + "="*60)
    print("TASK 2: NORMALIZE CASING TO CONSISTENT STANDARD")
    print("="*60)
    print("Business Decision: Convert categorical text to lowercase to prevent duplicates caused by mixed casing (e.g. 'JOHN', 'john', 'John' map to 'john').")
    
    for col in columns_to_lower:
        if col in df_cleaned.columns:
            print(f"\n--- Column: {col} ---")
            print("Before casing normalization (.head()):")
            print(df_cleaned[col].head(5).to_string())
            
            df_cleaned[col] = df_cleaned[col].str.lower()
            
            print("After casing normalization (.head()):")
            print(df_cleaned[col].head(5).to_string())
            print(f"Normalized {col} to lowercase")
    
    return df_cleaned


def remove_special_characters(df, columns):
    """
    Task 3: Remove special characters using regex pattern [^a-zA-Z0-9 ].
    """
    df_cleaned = df.copy()
    print("\n" + "="*60)
    print("TASK 3: REMOVE SPECIAL CHARACTERS USING REGEX")
    print("="*60)
    print("Regex Pattern: '[^a-zA-Z0-9 ]' - Matches any character that is NOT an alphanumeric character or space.")
    print("Explanation: Strips international accents (e.g., 'São Paulo' → 'So Paulo', 'Montréal' → 'Montreal'), punctuation ('New-York!' → 'NewYork'), and symbols.")
    
    pattern = r'[^a-zA-Z0-9 ]'
    for col in columns:
        if col in df_cleaned.columns:
            print(f"\n--- Column: {col} ---")
            print("Before special character removal:")
            print(df_cleaned[col].to_string())
            
            df_cleaned[col] = df_cleaned[col].str.replace(pattern, '', regex=True)
            
            print("After special character removal:")
            print(df_cleaned[col].to_string())
            print(f"Removed special characters from {col}")
    
    return df_cleaned


def standardize_categorical_labels(df, col, segment_map):
    """
    Task 4: Standardize categorical labels using mapping dictionary.
    """
    df_cleaned = df.copy()
    print("\n" + "="*60)
    print("TASK 4: STANDARDIZE CATEGORICAL LABELS USING MAPPING DICTIONARY")
    print("="*60)
    print("Business Decisions for Canonical Forms:")
    print("  - 'B2B': Consolidated 'b2b', 'b 2 b', 'b2 b' for standard CRM integration.")
    print("  - 'SMB': Consolidated 'sme', 'small medium enterprise' into standard SMB segment.")
    print("  - 'Enterprise': Standardized 'enterprise' for corporate reporting.")
    
    print(f"\n--- Column: {col} ---")
    print("Value counts before mapping:")
    print(df_cleaned[col].value_counts().to_string())
    
    df_cleaned[col] = df_cleaned[col].map(segment_map)
    
    print("\nValue counts after mapping:")
    print(df_cleaned[col].value_counts().to_string())
    
    return df_cleaned


def clean_text_column(series, lowercase=True, strip=True, 
                     remove_special=False, mapping=None):
    """
    Task 5: Reusable text cleaning function for any string column.
    """
    result = series.copy()
    
    if result.isna().any():
        print(f"Warning: {result.isna().sum()} null values in column")
    
    if strip:
        result = result.str.strip()
    
    if lowercase:
        result = result.str.lower()
    
    if remove_special:
        result = result.str.replace(r'[^a-zA-Z0-9 ]', '', regex=True)
    
    if mapping:
        result = result.map(mapping)
    
    return result


def run_edge_case_tests():
    """
    Test suite for clean_text_column on edge cases.
    """
    print("\n" + "="*60)
    print("TASK 5: TESTING REUSABLE FUNCTION WITH EDGE CASES")
    print("="*60)
    
    test_cases = [
        '  Product A  ',      # Leading/trailing spaces
        'PRODUCT B',         # All caps
        'Product_C',         # Special char
        None,                # Null value
        ''                   # Empty string
    ]
    
    test_series = pd.Series(test_cases)
    print("Input Test Series:")
    print(test_series.to_string())
    
    print("\nCleaning output (lowercase=True, strip=True, remove_special=True):")
    result = clean_text_column(test_series, lowercase=True, strip=True, remove_special=True)
    print(result.to_string())


if __name__ == "__main__":
    os.makedirs('data/processed', exist_ok=True)
    
    print("\n" + "="*70)
    print("STRING CLEANING PIPELINE EXECUTION")
    print("="*70)
    
    # Load sample dataset
    df = pd.read_csv('data/raw/messy_text_data.csv')
    print("\nInitial Data Head:")
    print(df.head(10).to_string())
    
    # Task 1: Strip Whitespace
    df = strip_all_strings(df)
    
    # Task 2: Normalize Casing
    df = normalize_casing(df, columns_to_lower=['customer_name', 'product_name', 'customer_segment'])
    
    # Task 3: Remove Special Characters
    df = remove_special_characters(df, columns=['location', 'product_name'])
    
    # Task 4: Standardize Categorical Labels
    segment_map = {
        'b2b': 'B2B',
        'b 2 b': 'B2B',
        'b2 b': 'B2B',
        'sme': 'SMB',
        'small medium enterprise': 'SMB',
        'enterprise': 'Enterprise'
    }
    df = standardize_categorical_labels(df, col='customer_segment', segment_map=segment_map)
    
    # Task 5: Edge Case Testing
    run_edge_case_tests()
    
    # Task 5 Application on dataset columns with custom options
    print("\nApplying reusable clean_text_column to product_name:")
    df['product_name'] = clean_text_column(
        df['product_name'], lowercase=True, strip=True, remove_special=True
    )
    
    # Save cleaned data
    df.to_csv('data/processed/cleaned_text_data.csv', index=False)
    print("\n✓ Cleaned dataset saved to data/processed/cleaned_text_data.csv")
