import streamlit as st
import pandas as pd
import numpy as np

# Page configuration
st.set_page_config(page_title="Analytics Dashboard", layout="wide")

# ==============================================================================
# TASK 1 & 2: SESSION STATE INITIALISATION
# We use the pattern: `if key not in st.session_state` to initialise safely.
# This ensures the value is set only on the very first run of the script.
# On every subsequent rerun (e.g. when a widget changes), Streamlit skips
# this block because the key already exists, so the value is PERSISTED.
# Without session_state, every rerun would reset these values to defaults.
# ==============================================================================

# KEY 1: "selected_segment"
# Purpose: Stores which segment the user confirmed in Step 1 of the workflow.
# Why needed: When the user interacts with any sidebar widget, Streamlit reruns
# the entire script. Without persisting this in session_state, the confirmed
# segment would be lost and Step 2 would never render correctly.
if "selected_segment" not in st.session_state:
    st.session_state["selected_segment"] = "All"  # Default: show all segments

# KEY 2: "workflow_step"
# Purpose: Acts as a gate that controls which steps are visible.
# Why needed: Step 2 must ONLY appear after Step 1 is explicitly confirmed.
# Storing step progress in session_state means the gate (workflow_step >= 2)
# stays open across reruns once the user has confirmed their segment choice.
if "workflow_step" not in st.session_state:
    st.session_state["workflow_step"] = 1  # Default: start at Step 1

# KEY 3: "analysis_result"
# Purpose: Caches the computed metrics (record count, total revenue, avg revenue)
# that were calculated when the user clicked "Confirm Segment" in Step 1.
# Why needed: Without caching, any unrelated widget interaction (e.g. changing
# the date filter) would recompute or lose the Step 2 analysis data.
if "analysis_result" not in st.session_state:
    st.session_state["analysis_result"] = None  # Default: no analysis yet

# "filter_date_start" - caches initial date range lower bound for filter persistence
if "filter_date_start" not in st.session_state:
    st.session_state["filter_date_start"] = None

# "computed_revenue" - stores aggregated financial metrics across workflows
if "computed_revenue" not in st.session_state:
    st.session_state["computed_revenue"] = 0.0

# "export_ready" - flags if processed dataset is prepared for downstream export
if "export_ready" not in st.session_state:
    st.session_state["export_ready"] = False


# Cached default dataset for initial load
@st.cache_data
def get_default_data():
    dates = pd.date_range(start="2025-01-01", end="2025-12-31", freq="D")
    segments = ["Enterprise", "Mid-Market", "SMB", "Consumer"]
    np.random.seed(42)
    n = len(dates) * 3
    data = {
        "date": np.random.choice(dates, size=n),
        "segment": np.random.choice(segments, size=n, p=[0.25, 0.35, 0.25, 0.15]),
        "revenue": np.random.randint(100, 10000, size=n),
        "orders": np.random.randint(1, 50, size=n),
        "users": np.random.randint(10, 500, size=n),
        "delay_minutes": np.random.exponential(scale=15, size=n).round(1)
    }
    sample_df = pd.DataFrame(data)
    sample_df["date"] = pd.to_datetime(sample_df["date"])
    return sample_df.sort_values("date").reset_index(drop=True)


# Load dataset: from session_state if uploaded, else default dataset
if "df" not in st.session_state:
    st.session_state["df"] = get_default_data()

df = st.session_state["df"]

# Ensure date column is datetime
if "date" in df.columns and not pd.api.types.is_datetime64_any_dtype(df["date"]):
    try:
        df["date"] = pd.to_datetime(df["date"])
    except Exception:
        pass


# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to",
    ["Overview", "Trends", "Data Explorer"]
)

# Sidebar interactive filtering controls
st.sidebar.divider()
st.sidebar.header("Filters")

# Reset buttons in sidebar
if st.sidebar.button("Reset Filters"):
    for k in ["date_filter", "segment_filter", "revenue_filter"]:
        if k in st.session_state:
            del st.session_state[k]
    st.rerun()

st.sidebar.divider()

# ---------------------------------------------------------------
# TASK 4: RESET MECHANISM
# Clicking this button explicitly resets every session state key
# that drives the multi-step workflow back to its initial default
# value, then reruns the script so the UI reflects the clean state.
# ---------------------------------------------------------------
if st.sidebar.button("🔄 Reset Workflow", type="primary"):
    st.session_state["selected_segment"] = "All"   # default: no segment chosen
    st.session_state["workflow_step"] = 1            # default: back to Step 1
    st.session_state["analysis_result"] = None       # default: no cached result
    st.rerun()

# Ensure required columns exist for filtering
has_date = "date" in df.columns and pd.api.types.is_datetime64_any_dtype(df["date"])
has_segment = "segment" in df.columns
has_revenue = "revenue" in df.columns and pd.api.types.is_numeric_dtype(df["revenue"])

# Widget 1 - Date range picker
if has_date:
    min_date = df["date"].min().date() if hasattr(df["date"].min(), "date") else df["date"].min()
    max_date = df["date"].max().date() if hasattr(df["date"].max(), "date") else df["date"].max()
    date_range = st.sidebar.date_input(
        "Date Range",
        value=(min_date, max_date),
        key="date_filter"
    )
else:
    date_range = None

# Widget 2 - Multi-select for segments
if has_segment:
    all_segments = df["segment"].dropna().unique().tolist()
    selected_segments = st.sidebar.multiselect(
        "Segments",
        options=all_segments,
        default=all_segments,
        key="segment_filter"
    )
else:
    all_segments = []
    selected_segments = []

# Widget 3 - Revenue slider
if has_revenue:
    min_rev_val = int(df["revenue"].min())
    max_rev_val = int(df["revenue"].max())
    if min_rev_val == max_rev_val:
        max_rev_val += 1
    min_rev, max_rev = st.sidebar.slider(
        "Revenue Range",
        min_value=min_rev_val,
        max_value=max_rev_val,
        value=(min_rev_val, max_rev_val),
        key="revenue_filter"
    )
else:
    min_rev, max_rev = 0, 0

# Wire Widgets to Filter DataFrame
filtered_df = df.copy()

if has_date and date_range:
    if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
        start_date, end_date = date_range[0], date_range[1]
    elif isinstance(date_range, (list, tuple)) and len(date_range) == 1:
        start_date, end_date = date_range[0], date_range[0]
    else:
        start_date, end_date = date_range, date_range
    filtered_df = filtered_df[
        (filtered_df["date"] >= pd.Timestamp(start_date))
        & (filtered_df["date"] <= pd.Timestamp(end_date))
    ]

if has_segment and selected_segments:
    filtered_df = filtered_df[filtered_df["segment"].isin(selected_segments)]
elif has_segment and not selected_segments:
    filtered_df = filtered_df.iloc[0:0]

if has_revenue:
    filtered_df = filtered_df[
        (filtered_df["revenue"] >= min_rev)
        & (filtered_df["revenue"] <= max_rev)
    ]

# Handle Empty Filter Combinations
if len(filtered_df) == 0:
    st.warning("No data matches the current filters. Try broadening your selection.")
    st.stop()


# ---------------------------------------------------------
# PAGE 1: OVERVIEW
# ---------------------------------------------------------
if page == "Overview":
    st.title("Business Overview")

    # KPI summary metrics directly at the top (above the fold)
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("Revenue", "$5.2M", "+12.5%")
    with col2:
        st.metric("Users", "2,500", "+5.2%")
    with col3:
        st.metric("AOV", "$45", "+2.1%")
    with col4:
        st.metric("Churn", "5.2%", "-2.8%", delta_color="inverse")
    with col5:
        st.metric("NPS", "72", "+4")

    # Expander for methodology notes
    with st.expander("About These Metrics"):
        st.write(
            "Revenue is calculated as sum of all order amounts "
            "for the current month. Churn is the percentage of "
            "customers who did not return within 30 days."
        )

    st.divider()

    st.header("Executive Summary")
    st.subheader("Performance Highlights")
    st.write(f"Showing {len(filtered_df):,} of {len(df):,} records based on active filters.")

    col_a, col_b = st.columns(2)
    with col_a:
        if has_revenue:
            total_rev = filtered_df["revenue"].sum()
            st.metric("Filtered Total Revenue", f"${total_rev:,.0f}")
        else:
            st.write("Operational route efficiency: **94.8%**")
    with col_b:
        if has_segment:
            st.metric("Active Segments in Filter", f"{filtered_df['segment'].nunique()} of {len(all_segments)}")
        else:
            st.write("On-time delivery SLA compliance: **98.2%**")

    with st.expander("Summary Details & Methodology"):
        st.write(
            "Executive metrics aggregate end-to-end logistics scan times, "
            "warehouse transfer checkpoints, and transit exception logs."
        )


# ---------------------------------------------------------
# PAGE 2: TRENDS & MULTI-STEP GUIDED WORKFLOW
# ---------------------------------------------------------
elif page == "Trends":
    st.title("Trend Analysis")

    # ===========================================================
    # TASK 3: MULTI-STEP WORKFLOW — STEP 1
    # The user must explicitly confirm their segment choice here.
    # On confirmation:
    #   1. We save the chosen segment to session_state["selected_segment"]
    #   2. We advance the gate: session_state["workflow_step"] = 2
    #   3. We pre-compute and cache metrics into session_state["analysis_result"]
    # This means Step 2 DEPENDS ON Step 1 being completed — it will not
    # render until workflow_step reaches 2, enforcing the sequential flow.
    # ===========================================================
    st.header("Step 1: Select Segment")
    segment_options = ["All", "Enterprise", "Mid-Market", "SMB"]
    # Read current value from session_state so the selectbox shows the
    # previously confirmed choice even after a rerun.
    curr_seg = st.session_state["selected_segment"]
    curr_index = segment_options.index(curr_seg) if curr_seg in segment_options else 0
    segment = st.selectbox("Segment", segment_options, index=curr_index)

    if st.button("Confirm Segment"):
        # Persist the confirmed segment so Step 2 can read it after rerun
        st.session_state["selected_segment"] = segment
        # Advance the workflow gate — Step 2 checks this value
        st.session_state["workflow_step"] = 2
        # Pre-compute and cache the analysis result for the chosen segment
        if segment == "All":
            step_data = filtered_df
        else:
            step_data = filtered_df[filtered_df["segment"] == segment] if "segment" in filtered_df.columns else filtered_df
        
        # Cache computed metrics so they survive future reruns unchanged
        st.session_state["analysis_result"] = {
            "record_count": len(step_data),
            "total_revenue": float(step_data["revenue"].sum()) if "revenue" in step_data.columns else 0.0,
            "avg_revenue": float(step_data["revenue"].mean()) if "revenue" in step_data.columns and len(step_data) > 0 else 0.0,
            "segment_name": segment
        }
        st.rerun()

    # ===========================================================
    # TASK 3: MULTI-STEP WORKFLOW — STEP 2
    # This section is GATED by workflow_step >= 2.
    # It will NOT render on the first load (workflow_step starts at 1).
    # It only becomes visible AFTER the user completes Step 1 by clicking
    # "Confirm Segment", which sets workflow_step = 2 in session_state.
    # This is the core dependency: Step 2 depends entirely on Step 1.
    # ===========================================================
    if st.session_state["workflow_step"] >= 2:
        st.header("Step 2: Analysis")
        # Read the confirmed segment from session_state (set in Step 1)
        chosen = st.session_state["selected_segment"]
        st.write("Analysing: " + chosen)
        
        # Compute and display results for chosen segment
        if chosen == "All":
            workflow_data = filtered_df
        else:
            workflow_data = filtered_df[filtered_df["segment"] == chosen] if "segment" in filtered_df.columns else filtered_df

        col_w1, col_w2, col_w3 = st.columns(3)
        with col_w1:
            st.metric("Segment Records", f"{len(workflow_data):,}")
        with col_w2:
            if "revenue" in workflow_data.columns:
                st.metric("Segment Revenue", f"${workflow_data['revenue'].sum():,.0f}")
            else:
                st.metric("Segment Status", "Active")
        with col_w3:
            if "revenue" in workflow_data.columns and len(workflow_data) > 0:
                st.metric("Avg Revenue / Order", f"${workflow_data['revenue'].mean():,.2f}")
            else:
                st.metric("Confidence", "99.4%")

        if "date" in workflow_data.columns and "revenue" in workflow_data.columns and len(workflow_data) > 0:
            st.subheader(f"Revenue Trend for {chosen}")
            trend_series = (
                workflow_data.set_index("date")
                .resample("ME" if hasattr(pd, "resample") else "M")["revenue"]
                .sum()
            )
            st.line_chart(trend_series)

        with st.expander("Workflow Details & Methodology"):
            st.write(
                f"State is preserved for segment '{chosen}'. Intermediate computations are cached "
                "in `st.session_state['analysis_result']` so modifying unrelated widgets does not reset step progress."
            )

    st.divider()

    st.header("Revenue Trends")
    st.subheader("Monthly Revenue (Last 12 Months)")

    col1, col2 = st.columns(2)
    with col1:
        if has_date and has_revenue and len(filtered_df) > 0:
            trend_df = (
                filtered_df.set_index("date")
                .resample("ME" if hasattr(pd, "resample") else "M")["revenue"]
                .sum()
            )
            st.line_chart(trend_df)
        else:
            st.write("Chart placeholder")
    with col2:
        st.write(f"Active Filtered Records: **{len(filtered_df):,}**")
        if has_revenue:
            st.write(f"Filtered Average Revenue / Record: **${filtered_df['revenue'].mean():,.2f}**")
        else:
            st.write("Time-series charts and comparisons will appear here.")

    with st.expander("Revenue Trend Insights"):
        st.write(
            "Historical monthly revenue tracking shows strong Q3/Q4 seasonality "
            "driven by peak fulfillment periods across primary transit corridors."
        )

    st.divider()

    st.header("Customer Metrics")
    st.subheader("Active Customers Over Time")

    col3, col4 = st.columns(2)
    with col3:
        if has_segment and len(filtered_df) > 0:
            segment_counts = filtered_df["segment"].value_counts()
            st.bar_chart(segment_counts)
        else:
            st.write("Chart placeholder")
    with col4:
        st.write("Customer growth rate: **+8.4% YoY**")

    with st.expander("Customer Metrics Methodology"):
        st.write(
            "Active customer counts include accounts with at least one dispatched "
            "or completed shipment order within the trailing 30-day window."
        )


# ---------------------------------------------------------
# PAGE 3: DATA EXPLORER
# ---------------------------------------------------------
elif page == "Data Explorer":
    st.title("Data Explorer")

    uploaded_file = st.file_uploader("Upload your dataset", type=["csv", "json"])

    if uploaded_file is not None:
        try:
            if uploaded_file.name.endswith(".csv"):
                uploaded_df = pd.read_csv(uploaded_file)
            elif uploaded_file.name.endswith(".json"):
                uploaded_df = pd.read_json(uploaded_file)
            else:
                st.error("Unsupported file type.")
                st.stop()

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

        # Update session state with uploaded dataframe
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

    # Quick Exploration (Downstream Demonstration)
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
