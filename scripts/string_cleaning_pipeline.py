import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# Task 1: Strip Whitespace Consistently
# ---------------------------------------------------------------------------
def strip_all_strings(df):
    """Strip whitespace from all string columns."""
    print("\n" + "="*50)
    print("TASK 1: STRIPPING WHITESPACE")
    print("="*50)
    
    df_clean = df.copy()
    string_cols = df_clean.select_dtypes(include=['object']).columns
    
    for col in string_cols:
        if df_clean[col].dtype == 'object':
            # Count unique values before stripping
            before = df_clean[col].nunique()
            
            # Count values that have leading/trailing whitespace
            has_whitespace = df_clean[col].str.contains(r'^\s+|\s+$', regex=True).sum()
            
            # Apply strip
            df_clean[col] = df_clean[col].str.strip()
            
            # Count unique values after stripping
            after = df_clean[col].nunique()
            
            print(f"{col}:")
            print(f"  Fixed {has_whitespace} values with leading/trailing spaces.")
            print(f"  Unique values: {before} -> {after}")
            
    return df_clean

# ---------------------------------------------------------------------------
# Task 2: Normalize Casing to Consistent Standard
# ---------------------------------------------------------------------------
def normalize_casing(df, columns_to_lower):
    """Normalize casing for specified columns."""
    print("\n" + "="*50)
    print("TASK 2: NORMALIZING CASING")
    print("="*50)
    
    df_clean = df.copy()
    
    for col in columns_to_lower:
        if col in df_clean.columns:
            print(f"\nNormalizing '{col}' to lowercase...")
            print("Before:")
            print(df_clean[col].value_counts().head(3).to_string())
            
            # Apply lowercase
            df_clean[col] = df_clean[col].str.lower()
            
            print("\nAfter:")
            print(df_clean[col].value_counts().head(3).to_string())
            print(f"[OK] Normalized {col} to lowercase. (Standardizing to lowercase ensures 'JOHN' and 'john' are grouped together).")
            
    return df_clean

# ---------------------------------------------------------------------------
# Task 3: Remove Special Characters Using Regex
# ---------------------------------------------------------------------------
def remove_special_characters(df, columns):
    """Remove special characters from specified columns."""
    print("\n" + "="*50)
    print("TASK 3: REMOVING SPECIAL CHARACTERS")
    print("="*50)
    
    df_clean = df.copy()
    
    for col in columns:
        if col in df_clean.columns:
            print(f"\nProcessing '{col}'...")
            # Show a sample before
            sample_before = df_clean[col].head(3).tolist()
            
            # Pattern [^a-zA-Z0-9 ] matches anything that is NOT a letter, number, or space
            pattern = r'[^a-zA-Z0-9 ]'
            df_clean[col] = df_clean[col].str.replace(pattern, '', regex=True)
            
            sample_after = df_clean[col].head(3).tolist()
            
            print(f"Pattern used: {pattern} (Matches any non-alphanumeric character except spaces)")
            for b, a in zip(sample_before, sample_after):
                if b != a:
                    print(f"  Changed: '{b}' -> '{a}'")
            print(f"[OK] Removed special characters from {col}")
            
    return df_clean

# ---------------------------------------------------------------------------
# Task 4: Standardize Categorical Labels Using Mapping Dictionary
# ---------------------------------------------------------------------------
def standardize_labels(df, col, mapping_dict):
    """Standardize labels using a mapping dictionary."""
    print("\n" + "="*50)
    print("TASK 4: STANDARDIZING LABELS")
    print("="*50)
    
    df_clean = df.copy()
    
    if col in df_clean.columns:
        print(f"Standardizing '{col}' using mapping dictionary...")
        print("\nBefore Mapping:")
        print(df_clean[col].value_counts().to_string())
        
        # Apply mapping. We use replace so unmapped values stay as they are, 
        # but map can be used if we want unmapped to become NaN.
        df_clean[col] = df_clean[col].replace(mapping_dict)
        
        print("\nAfter Mapping:")
        print(df_clean[col].value_counts().to_string())
        
        print("\nJustification:")
        print("We consolidate variants like 'b2b' and 'b 2 b' into 'B2B' to ensure accurate grouping.")
        print("SME variants are standardized to 'SMB' (Small/Medium Business) to align with CRM naming conventions.")
        
    return df_clean

# ---------------------------------------------------------------------------
# Task 5: Build Reusable String Cleaning Function
# ---------------------------------------------------------------------------
def clean_text_column(series, lowercase=True, strip=True, remove_special=False, mapping=None):
    """
    Reusable text cleaning function for any string column.
    
    Args:
        series: Pandas Series (string column)
        lowercase: Boolean, convert to lowercase
        strip: Boolean, remove leading/trailing whitespace
        remove_special: Boolean, remove non-alphanumeric chars
        mapping: Dictionary, map values to canonical forms
        
    Returns:
        Cleaned Pandas Series
    """
    result = series.copy()
    
    # Handle nulls
    if result.isna().any():
        print(f"  Warning: {result.isna().sum()} null values in column")
        
    if strip:
        result = result.str.strip()
        
    if lowercase:
        result = result.str.lower()
        
    if remove_special:
        result = result.str.replace(r'[^a-zA-Z0-9 ]', '', regex=True)
        
    if mapping:
        result = result.replace(mapping)
        
    return result

# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # 1. Load data
    try:
        df = pd.read_csv('data/raw/messy_strings.csv')
        print("Loaded data/raw/messy_strings.csv successfully.")
    except FileNotFoundError:
        print("File not found. Please ensure data/raw/messy_strings.csv exists.")
        exit()
        
    # --- Execute Tasks 1-4 Step-by-Step for demonstration ---
    print("\n--- RUNNING INDIVIDUAL TASKS ---")
    df_step1 = strip_all_strings(df)
    
    # Identify casing columns
    cols_to_lower = ['customer_name', 'product_category', 'customer_segment']
    df_step2 = normalize_casing(df_step1, cols_to_lower)
    
    # Remove special chars (international characters in city)
    df_step3 = remove_special_characters(df_step2, ['city', 'product_category'])
    
    # Map customer segments
    segment_map = {
        'b2b': 'B2B',
        'b 2 b': 'B2B',
        'b2 b': 'B2B',
        'sme': 'SMB',
        'small medium enterprise': 'SMB',
        'enterprise': 'Enterprise'
    }
    df_step4 = standardize_labels(df_step3, 'customer_segment', segment_map)
    
    # --- Execute Task 5 using the reusable pipeline ---
    print("\n" + "="*50)
    print("TASK 5: REUSABLE PIPELINE")
    print("="*50)
    
    df_pipeline = df.copy()
    
    # Clean name: strip and lowercase, but allow special chars (like apostrophes in O'Connor)
    print("Applying reusable function to 'customer_name' (strip=True, lowercase=True, remove_special=False)")
    df_pipeline['customer_name'] = clean_text_column(
        df_pipeline['customer_name'], lowercase=True, strip=True, remove_special=False
    )
    
    # Clean category: strip, lowercase, remove special characters
    print("Applying reusable function to 'product_category' (strip=True, lowercase=True, remove_special=True)")
    df_pipeline['product_category'] = clean_text_column(
        df_pipeline['product_category'], lowercase=True, strip=True, remove_special=True
    )
    
    # Clean segment: strip, lowercase, remove special characters, and apply mapping
    # Note: lowercase first, so mapping dict can safely assume lowercase keys
    print("Applying reusable function to 'customer_segment' (strip=True, lowercase=True, remove_special=True, mapping=True)")
    
    # Use lowercase keys for mapping since the pipeline lowercases first
    pipeline_segment_map = {
        'b2b': 'B2B',
        'b 2 b': 'B2B',
        'sme': 'SMB',
        'small medium enterprise': 'SMB',
        'enterprise': 'Enterprise'
    }
    
    df_pipeline['customer_segment'] = clean_text_column(
        df_pipeline['customer_segment'], lowercase=True, strip=True, remove_special=True, mapping=pipeline_segment_map
    )
    
    # Clean city: strip and remove special characters (removes accents), don't lowercase
    print("Applying reusable function to 'city' (strip=True, lowercase=False, remove_special=True)")
    df_pipeline['city'] = clean_text_column(
        df_pipeline['city'], lowercase=False, strip=True, remove_special=True
    )
    
    print("\nFinal Cleaned DataFrame (using reusable pipeline):")
    print(df_pipeline.to_string())
    
    # --- Testing Edge Cases ---
    print("\n" + "="*50)
    print("TESTING EDGE CASES")
    print("="*50)
    test_cases = [
        ' Product A ',    # Leading/trailing spaces
        'PRODUCT B',      # All caps
        'Product_C!',     # Special char
        None,             # Null value
        ''                # Empty string
    ]
    test_series = pd.Series(test_cases)
    result = clean_text_column(test_series, lowercase=True, strip=True, remove_special=True)
    
    print("Original Series:")
    print(test_series.tolist())
    print("\nCleaned Series:")
    print(result.tolist())
    
    # Save output
    import os
    os.makedirs('data/processed', exist_ok=True)
    df_pipeline.to_csv('data/processed/cleaned_strings.csv', index=False)
    print("\nCleaned data saved to data/processed/cleaned_strings.csv")
