import os
import argparse
import logging
import pandas as pd

# Configure logging with timestamps (Task 3)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def ingest(path):
    """Stage 1: Ingest raw data."""
    logger.info("Ingesting: " + path)
    if not os.path.exists(path):
        logger.error("Input file not found: " + path)
        raise FileNotFoundError("Input file not found: " + path)
    df = pd.read_csv(path)
    logger.info("Rows ingested: " + str(len(df)))
    return df


def clean(df):
    """Stage 2: Clean and validate data."""
    logger.info("Cleaning...")
    initial = len(df)

    id_col = next((c for c in ["customer_id", "Order Customer Id", "id", "user_id"] if c in df.columns), None)
    amt_col = next((c for c in ["amount", "revenue", "Sales", "Sales per customer", "Order Item Total"] if c in df.columns), None)

    if id_col and amt_col:
        df = df.dropna(subset=[id_col, amt_col]).copy()
        df[amt_col] = pd.to_numeric(df[amt_col], errors="coerce")
        df = df[df[amt_col] > 0].copy()
    elif amt_col:
        df = df.dropna(subset=[amt_col]).copy()
        df[amt_col] = pd.to_numeric(df[amt_col], errors="coerce")
        df = df[df[amt_col] > 0].copy()
    else:
        df = df.dropna().copy()

    logger.info("Cleaned: " + str(initial) + " -> " + str(len(df)))
    return df


def aggregate(df):
    """Stage 3: Compute aggregations."""
    logger.info("Aggregating...")
    seg_col = next((c for c in ["segment", "Customer Segment", "category", "Category Name", "Department Name"] if c in df.columns), None)
    amt_col = next((c for c in ["amount", "revenue", "Sales", "Sales per customer", "Order Item Total"] if c in df.columns), None)
    order_col = next((c for c in ["order_id", "Order Id", "id"] if c in df.columns), None)

    if amt_col is None:
        num_cols = df.select_dtypes(include="number").columns
        amt_col = num_cols[0] if len(num_cols) > 0 else None

    if seg_col and amt_col and order_col:
        agg = df.groupby(seg_col).agg(
            revenue=(amt_col, "sum"),
            orders=(order_col, "count"),
            avg_order=(amt_col, "mean")
        ).reset_index()
    elif seg_col and amt_col:
        agg = df.groupby(seg_col).agg(
            revenue=(amt_col, "sum"),
            orders=(amt_col, "count")
        ).reset_index()
    elif amt_col:
        agg = pd.DataFrame([{
            "segment": "All",
            "revenue": df[amt_col].sum(),
            "orders": len(df)
        }])
    else:
        agg = pd.DataFrame([{"records": len(df)}])

    logger.info("Segments: " + str(len(agg)))
    return agg


def output(df, agg, out_dir):
    """Stage 4: Write output files."""
    logger.info("Writing output to: " + out_dir)
    os.makedirs(out_dir, exist_ok=True)
    df.to_csv(os.path.join(out_dir, "cleaned.csv"), index=False)
    agg.to_csv(os.path.join(out_dir, "aggregated.csv"), index=False)
    # Also write aliases for full compatibility
    df.to_csv(os.path.join(out_dir, "cleaned_data.csv"), index=False)
    agg.to_csv(os.path.join(out_dir, "aggregated_metrics.csv"), index=False)
    logger.info("Output written to: " + out_dir)
    logger.info("Pipeline complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automated Data Pipeline")
    parser.add_argument("--input", required=True, help="Input CSV path")
    parser.add_argument("--output", default="output", help="Output directory")
    args = parser.parse_args()

    raw = ingest(args.input)
    cleaned = clean(raw)
    agg = aggregate(cleaned)
    output(cleaned, agg, args.output)
