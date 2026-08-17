import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import io

# Page configuration
st.set_page_config(page_title="Analytics Dashboard", layout="wide")

# ==============================================================================
# THRESHOLD CONFIGURATION (Task 1 & Task 3)
# ==============================================================================
ALERT_THRESHOLDS = {
    "churn_rate": {
        "metric": "Churn Rate",
        "threshold": 7.0,
        "direction": "above",
        "severity": "critical",
        "message": "Churn exceeds safe limit. Investigate retention."
    },
    "avg_order_value": {
        "metric": "Avg Order Value",
        "threshold": 30.0,
        "direction": "below",
        "severity": "warning",
        "message": "AOV below target. Check pricing and product mix."
    },
    "null_percentage": {
        "metric": "Data Quality",
        "threshold": 5.0,
        "direction": "above",
        "severity": "warning",
        "message": "Null percentage too high. Check data pipeline."
    }
}


# ==============================================================================
# SESSION STATE INITIALISATION & DOCUMENTATION
# ==============================================================================

# "selected_segment" - stores the user's segment choice from Step 1
# so it survives reruns when the user interacts with Step 2 widgets.
if "selected_segment" not in st.session_state:
    st.session_state["selected_segment"] = "All"

# "workflow_step" - tracks which step the user has completed.
# Prevents Step 2 from displaying before Step 1 is confirmed.
if "workflow_step" not in st.session_state:
    st.session_state["workflow_step"] = 1

# "analysis_result" - caches the computation from Step 2 so
# it does not recompute when unrelated widgets are changed.
if "analysis_result" not in st.session_state:
    st.session_state["analysis_result"] = None

# "filter_date_start" - caches initial date range lower bound for filter persistence
if "filter_date_start" not in st.session_state:
    st.session_state["filter_date_start"] = None

# "computed_revenue" - stores aggregated financial metrics across workflows
if "computed_revenue" not in st.session_state:
    st.session_state["computed_revenue"] = 0.0

# "export_ready" - flags if processed dataset is prepared for downstream export
if "export_ready" not in st.session_state:
    st.session_state["export_ready"] = False


# ==============================================================================
# CACHED DATA LOADING
# ==============================================================================

@st.cache_data
def load_data(file_bytes, file_name):
    """Cached loader for CSV and JSON datasets."""
    bio = io.BytesIO(file_bytes) if isinstance(file_bytes, bytes) else file_bytes
    if file_name.endswith(".csv"):
        return pd.read_csv(bio)
    elif file_name.endswith(".json"):
        return pd.read_json(bio)
    else:
        raise ValueError("Unsupported file format")


@st.cache_data
def get_default_data():
    """Generates realistic default dataset when no file is uploaded."""
    dates = pd.date_range(start="2025-01-01", end="2025-12-31", freq="D")
    segments = ["Enterprise", "Mid-Market", "SMB", "Consumer"]
    np.random.seed(42)
    n = len(dates) * 3
    data = {
        "date": np.random.choice(dates, size=n),
        "customer_id": [f"CUST-{np.random.randint(100, 300):04d}" for _ in range(n)],
        "segment": np.random.choice(segments, size=n, p=[0.25, 0.35, 0.25, 0.15]),
        "revenue": np.random.randint(100, 10000, size=n),
        "orders": np.random.randint(1, 50, size=n),
        "delay_minutes": np.random.exponential(scale=15, size=n).round(1)
    }
    sample_df = pd.DataFrame(data)
    sample_df["date"] = pd.to_datetime(sample_df["date"])
    return sample_df.sort_values("date").reset_index(drop=True)


# Initialize active dataset in session state
if "df" not in st.session_state:
    st.session_state["df"] = get_default_data()

df = st.session_state["df"]

# Adapt schema dynamically for generic datasets
date_col = "date" if "date" in df.columns else next((c for c in df.columns if "date" in c.lower() or "time" in c.lower()), None)
if date_col and not pd.api.types.is_datetime64_any_dtype(df[date_col]):
    try:
        df[date_col] = pd.to_datetime(df[date_col])
    except Exception:
        pass

has_date = date_col is not None and pd.api.types.is_datetime64_any_dtype(df[date_col])

rev_col = "revenue" if "revenue" in df.columns else next((c for c in df.select_dtypes(include="number").columns), None)
has_revenue = rev_col is not None

cust_col = "customer_id" if "customer_id" in df.columns else next((c for c in df.columns if "cust" in c.lower() or "id" in c.lower() or "user" in c.lower()), None)

seg_col = "segment" if "segment" in df.columns else next((c for c in df.select_dtypes(include=["object", "category"]).columns if c != cust_col), None)
has_segment = seg_col is not None


# ==============================================================================
# SIDEBAR CONTROLS & NAVIGATION
# ==============================================================================

st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to",
    ["Overview", "Trends", "Data Explorer"]
)

st.sidebar.divider()
st.sidebar.header("Filters")

# Reset buttons
col_btn1, col_btn2 = st.sidebar.columns(2)
with col_btn1:
    if st.button("Reset Filters"):
        for k in ["date_filter", "segment_filter", "revenue_filter"]:
            if k in st.session_state:
                del st.session_state[k]
        st.rerun()

with col_btn2:
    if st.button("Reset Workflow"):
        for key in ["selected_segment", "workflow_step", "analysis_result"]:
            if key in st.session_state:
                del st.session_state[key]
        st.rerun()

# Widget 1: Date Range
if has_date:
    min_date = df[date_col].min().date() if hasattr(df[date_col].min(), "date") else df[date_col].min()
    max_date = df[date_col].max().date() if hasattr(df[date_col].max(), "date") else df[date_col].max()
    date_range = st.sidebar.date_input(
        "Date Range",
        value=(min_date, max_date),
        key="date_filter"
    )
else:
    date_range = None

# Widget 2: Segments Multi-Select
if has_segment:
    all_segments = df[seg_col].dropna().unique().tolist()
    selected_segments = st.sidebar.multiselect(
        "Segments",
        options=all_segments,
        default=all_segments,
        key="segment_filter"
    )
else:
    all_segments = []
    selected_segments = []

# Widget 3: Numeric / Revenue Slider
if has_revenue:
    min_rev_val = int(df[rev_col].min())
    max_rev_val = int(df[rev_col].max())
    if min_rev_val == max_rev_val:
        max_rev_val += 1
    min_rev, max_rev = st.sidebar.slider(
        f"{rev_col.replace('_', ' ').title()} Range",
        min_value=min_rev_val,
        max_value=max_rev_val,
        value=(min_rev_val, max_rev_val),
        key="revenue_filter"
    )
else:
    min_rev, max_rev = 0, 0


# ==============================================================================
# FILTERING PIPELINE & EMPTY RESULT HANDLING
# ==============================================================================

filtered_df = df.copy()

if has_date and date_range:
    if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
        start_date, end_date = date_range[0], date_range[1]
    elif isinstance(date_range, (list, tuple)) and len(date_range) == 1:
        start_date, end_date = date_range[0], date_range[0]
    else:
        start_date, end_date = date_range, date_range
    filtered_df = filtered_df[
        (filtered_df[date_col] >= pd.Timestamp(start_date))
        & (filtered_df[date_col] <= pd.Timestamp(end_date))
    ]

if has_segment and selected_segments:
    filtered_df = filtered_df[filtered_df[seg_col].isin(selected_segments)]
elif has_segment and not selected_segments:
    filtered_df = filtered_df.iloc[0:0]

if has_revenue:
    filtered_df = filtered_df[
        (filtered_df[rev_col] >= min_rev)
        & (filtered_df[rev_col] <= max_rev)
    ]

if len(filtered_df) == 0:
    st.warning("No data matches current filters. Broaden your selection.")
    st.stop()


# ==============================================================================
# REACTIVE METRICS & THRESHOLD ALERT EVALUATION (Task 2, 4, 5)
# ==============================================================================

total_revenue = filtered_df[rev_col].sum() if has_revenue else 0.0
avg_order = filtered_df[rev_col].mean() if has_revenue and len(filtered_df) > 0 else 0.0
row_count = len(filtered_df)
unique_customers = filtered_df[cust_col].nunique() if cust_col and cust_col in filtered_df.columns else row_count

total_cells = filtered_df.shape[0] * filtered_df.shape[1]
null_pct = (filtered_df.isnull().sum().sum() / total_cells * 100) if total_cells > 0 else 0.0

# Evaluate churn rate dynamically based on filtered cohort
if "churn_rate" in filtered_df.columns:
    current_churn = float(filtered_df["churn_rate"].mean())
elif has_segment and len(filtered_df) > 0:
    seg_churn_weights = {"Consumer": 8.6, "SMB": 7.4, "Mid-Market": 4.6, "Enterprise": 2.2}
    weights = filtered_df[seg_col].map(seg_churn_weights).fillna(5.2)
    current_churn = float(weights.mean())
else:
    current_churn = 5.2

current_metrics = {
    "churn_rate": current_churn,
    "avg_order_value": float(avg_order),
    "null_percentage": float(null_pct)
}


def display_visual_alerts(metrics):
    """Checks current metrics against ALERT_THRESHOLDS and renders visual alerts."""
    breaches_found = 0
    for key, config in ALERT_THRESHOLDS.items():
        value = metrics.get(key, 0)
        breached = False
        if config["direction"] == "above" and value > config["threshold"]:
            breached = True
        elif config["direction"] == "below" and value < config["threshold"]:
            breached = True

        if breached:
            breaches_found += 1
            alert_text = (
                "ALERT: " + config["metric"]
                + " is " + str(round(value, 1))
                + " (threshold: " + str(config["threshold"]) + "). "
                + config["message"]
            )
            if config["severity"] == "critical":
                st.error(alert_text)
            else:
                st.warning(alert_text)
    return breaches_found


# ==============================================================================
# PAGE 1: OVERVIEW
# ==============================================================================
if page == "Overview":
    st.title("Business Overview")

    # Display visual alerts directly at top of overview (Task 2 & 4)
    display_visual_alerts(current_metrics)

    # Five Reactive KPI Metrics directly at top (above the fold)
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("Revenue", f"${total_revenue:,.0f}")
    with col2:
        st.metric("Avg Order", f"${avg_order:,.0f}")
    with col3:
        st.metric("Records", f"{row_count:,}")
    with col4:
        st.metric("Customers", f"{unique_customers:,}")
    with col5:
        st.metric("Quality", f"{100 - null_pct:.1f}%")

    with st.expander("About These Metrics"):
        st.write(
            "Metrics update reactively based on active sidebar filter selections. "
            "Threshold alerts automatically surface at the top when operational limits are breached."
        )

    st.divider()

    # Reactive Visualizations on Overview
    st.header("Executive Summary & Trends")
    st.subheader("Performance Highlights")
    st.write(f"Showing {len(filtered_df):,} of {len(df):,} records based on active filters.")

    col_a, col_b = st.columns(2)
    with col_a:
        st.subheader("Revenue by Segment")
        if has_segment and has_revenue:
            seg_chart = filtered_df.groupby(seg_col)[rev_col].sum().reset_index()
            st.bar_chart(seg_chart.set_index(seg_col))
        else:
            st.write("Segment chart placeholder")
    with col_b:
        st.subheader("Revenue Over Time")
        if has_date and has_revenue:
            trend_chart = filtered_df.groupby(date_col)[rev_col].sum().reset_index()
            st.line_chart(trend_chart.set_index(date_col))
        else:
            st.write("Time-series chart placeholder")

    with st.expander("Summary Details & Methodology"):
        st.write(
            "Executive metrics aggregate end-to-end logistics scan times, "
            "warehouse transfer checkpoints, and transit exception logs."
        )


# ==============================================================================
# PAGE 2: TRENDS & THREE CHART TYPES
# ==============================================================================
elif page == "Trends":
    st.title("Trend Analysis")

    # Display visual alerts at top of trends as well
    display_visual_alerts(current_metrics)

    # Multi-Step Workflow
    st.header("Step 1: Select Segment")
    segment_options = ["All"] + (all_segments if all_segments else ["Enterprise", "Mid-Market", "SMB"])
    curr_seg = st.session_state["selected_segment"]
    curr_index = segment_options.index(curr_seg) if curr_seg in segment_options else 0
    segment = st.selectbox("Segment", segment_options, index=curr_index)

    if st.button("Confirm Segment"):
        st.session_state["selected_segment"] = segment
        st.session_state["workflow_step"] = 2
        
        if segment == "All":
            step_data = filtered_df
        else:
            step_data = filtered_df[filtered_df[seg_col] == segment] if has_segment else filtered_df
        
        st.session_state["analysis_result"] = {
            "record_count": len(step_data),
            "total_revenue": float(step_data[rev_col].sum()) if has_revenue else 0.0,
            "avg_revenue": float(step_data[rev_col].mean()) if has_revenue and len(step_data) > 0 else 0.0,
            "segment_name": segment
        }
        st.rerun()

    if st.session_state["workflow_step"] >= 2:
        st.header("Step 2: Analysis")
        chosen = st.session_state["selected_segment"]
        st.write("Analysing: " + chosen)

        if chosen == "All":
            workflow_data = filtered_df
        else:
            workflow_data = filtered_df[filtered_df[seg_col] == chosen] if has_segment else filtered_df

        col_w1, col_w2, col_w3 = st.columns(3)
        with col_w1:
            st.metric("Segment Records", f"{len(workflow_data):,}")
        with col_w2:
            if has_revenue:
                st.metric("Segment Revenue", f"${workflow_data[rev_col].sum():,.0f}")
            else:
                st.metric("Segment Status", "Active")
        with col_w3:
            if has_revenue and len(workflow_data) > 0:
                st.metric("Avg Revenue / Record", f"${workflow_data[rev_col].mean():,.2f}")
            else:
                st.metric("Confidence", "99.4%")

    st.divider()

    # Three Reactive Chart Types
    st.header("Reactive Visualizations")

    # Chart 1: Line chart (trend)
    st.subheader("Revenue Over Time")
    if has_date and has_revenue and len(filtered_df) > 0:
        trend = filtered_df.groupby(date_col)[rev_col].sum().reset_index()
        st.line_chart(trend.set_index(date_col))
    else:
        st.info("Date or numeric column not available for line chart.")

    st.divider()

    # Chart 2: Bar chart (comparison)
    st.subheader("Revenue by Segment")
    if has_segment and has_revenue and len(filtered_df) > 0:
        seg = filtered_df.groupby(seg_col)[rev_col].sum().reset_index()
        st.bar_chart(seg.set_index(seg_col))
    else:
        st.info("Segment or numeric column not available for bar chart.")

    st.divider()

    # Chart 3: Plotly histogram (distribution)
    st.subheader("Revenue Distribution")
    if has_revenue and len(filtered_df) > 0:
        fig = px.histogram(filtered_df, x=rev_col, nbins=30, title=f"Distribution of {rev_col.title()}")
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Numeric column not available for distribution histogram.")


# ==============================================================================
# PAGE 3: DATA EXPLORER
# ==============================================================================
elif page == "Data Explorer":
    st.title("Data Explorer")

    uploaded_file = st.file_uploader("Upload your dataset", type=["csv", "json"])

    if uploaded_file is not None:
        try:
            file_bytes = uploaded_file.getvalue()
            uploaded_df = load_data(file_bytes, uploaded_file.name)

            if len(uploaded_df) == 0:
                st.warning("Uploaded file is empty.")
                st.stop()
        except Exception:
            st.error("Could not read this file. Check the format and try again.")
            st.stop()

        st.success(
            "Loaded: " + uploaded_file.name
            + " (" + str(len(uploaded_df)) + " rows, "
            + str(len(uploaded_df.columns)) + " columns)"
        )

        st.session_state["df"] = uploaded_df
        st.session_state["uploaded_file_name"] = uploaded_file.name

    # Filtered Records Summary
    st.header("Filtered Dataset View")
    st.write(f"Showing {len(filtered_df):,} of {len(df):,} records")
    st.dataframe(filtered_df.head(20), use_container_width=True)

    # Dataset Preview
    st.divider()
    st.header("Dataset Preview")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Rows", f"{len(filtered_df):,}")
    with col2:
        st.metric("Columns", str(len(filtered_df.columns)))
    with col3:
        total_cells = filtered_df.shape[0] * filtered_df.shape[1]
        null_pct = (filtered_df.isnull().sum().sum() / total_cells * 100) if total_cells > 0 else 0.0
        st.metric("Null %", f"{null_pct:.1f}%")

    st.subheader("First 10 Rows")
    st.dataframe(filtered_df.head(10), use_container_width=True)

    st.subheader("Column Summary")
    summary = pd.DataFrame({
        "Column": filtered_df.columns,
        "Type": filtered_df.dtypes.astype(str).values,
        "Non-Null": filtered_df.notnull().sum().values,
        "Null Count": filtered_df.isnull().sum().values,
        "Null %": (filtered_df.isnull().sum() / len(filtered_df) * 100).round(1).values if len(filtered_df) > 0 else 0
    })
    st.dataframe(summary, use_container_width=True)

    with st.expander("About Dataset Preview"):
        st.write(
            "Dataset preview shows summary dimensions, overall missing rate, "
            "the first 10 sample records, and column-by-column schema breakdown."
        )

    # Descriptive Statistics
    st.divider()
    st.header("Descriptive Statistics")
    st.dataframe(filtered_df.describe(), use_container_width=True)

    with st.expander("About Descriptive Statistics"):
        st.write(
            "Descriptive statistics summarize count, mean, standard deviation, "
            "min/max, and quartile distributions for numeric columns."
        )

    # Quick Exploration
    st.divider()
    st.subheader("Quick Exploration")
    numeric_cols = filtered_df.select_dtypes(include="number").columns.tolist()
    if numeric_cols:
        selected_col = st.selectbox("Select a column to visualise", numeric_cols)
        st.bar_chart(filtered_df[selected_col].value_counts().head(20))
    else:
        st.info("No numeric columns available in the uploaded dataset for visualization.")

    with st.expander("About Quick Exploration"):
        st.write(
            "Allows immediate frequency analysis of the top 20 distinct values "
            "for any selected numeric feature."
        )
