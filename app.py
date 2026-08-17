import streamlit as st
import pandas as pd

# Page configuration
st.set_page_config(page_title="Analytics Dashboard", layout="wide")

# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to",
    ["Overview", "Trends", "Data Explorer"]
)

# Main content area routed by navigation
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
    st.write("KPI summary cards and key metrics will appear here.")

    col_a, col_b = st.columns(2)
    with col_a:
        st.write("Operational route efficiency: **94.8%**")
    with col_b:
        st.write("On-time delivery SLA compliance: **98.2%**")

    with st.expander("Summary Details & Methodology"):
        st.write(
            "Executive metrics aggregate end-to-end logistics scan times, "
            "warehouse transfer checkpoints, and transit exception logs."
        )

elif page == "Trends":
    st.title("Trend Analysis")

    st.header("Revenue Trends")
    st.subheader("Monthly Revenue (Last 12 Months)")
    col1, col2 = st.columns(2)
    with col1:
        st.write("Chart placeholder")
    with col2:
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
        st.write("Chart placeholder")
    with col4:
        st.write("Customer growth rate: **+8.4% YoY**")

    with st.expander("Customer Metrics Methodology"):
        st.write(
            "Active customer counts include accounts with at least one dispatched "
            "or completed shipment order within the trailing 30-day window."
        )

elif page == "Data Explorer":
    st.title("Data Explorer")

    uploaded_file = st.file_uploader("Upload your dataset", type=["csv", "json"])

    if uploaded_file is not None:
        try:
            if uploaded_file.name.endswith(".csv"):
                df = pd.read_csv(uploaded_file)
            elif uploaded_file.name.endswith(".json"):
                df = pd.read_json(uploaded_file)
            else:
                st.error("Unsupported file type.")
                st.stop()

            if len(df) == 0:
                st.warning("Uploaded file is empty.")
                st.stop()
        except Exception:
            st.error("Could not read this file. Check the format and try again.")
            st.stop()

        st.success(
            "Loaded: " + uploaded_file.name
            + " (" + str(len(df)) + " rows, "
            + str(len(df.columns)) + " columns)"
        )

        # Store in session state for downstream use
        st.session_state["df"] = df
        st.session_state["uploaded_file_name"] = uploaded_file.name

        # Dataset Preview
        st.header("Dataset Preview")

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Rows", f"{len(df):,}")
        with col2:
            st.metric("Columns", str(len(df.columns)))
        with col3:
            total_cells = df.shape[0] * df.shape[1]
            null_pct = (df.isnull().sum().sum() / total_cells * 100) if total_cells > 0 else 0.0
            st.metric("Null %", f"{null_pct:.1f}%")

        st.subheader("First 10 Rows")
        st.dataframe(df.head(10), use_container_width=True)

        st.subheader("Column Summary")
        summary = pd.DataFrame({
            "Column": df.columns,
            "Type": df.dtypes.astype(str).values,
            "Non-Null": df.notnull().sum().values,
            "Null Count": df.isnull().sum().values,
            "Null %": (df.isnull().sum() / len(df) * 100).round(1).values if len(df) > 0 else 0
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
        st.dataframe(df.describe(), use_container_width=True)

        with st.expander("About Descriptive Statistics"):
            st.write(
                "Descriptive statistics summarize count, mean, standard deviation, "
                "min/max, and quartile distributions for numeric columns."
            )

        # Quick Exploration (Downstream Demonstration)
        st.divider()
        st.subheader("Quick Exploration")
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        if numeric_cols:
            selected_col = st.selectbox("Select a column to visualise", numeric_cols)
            st.bar_chart(df[selected_col].value_counts().head(20))
        else:
            st.info("No numeric columns available in the uploaded dataset for visualization.")

        with st.expander("About Quick Exploration"):
            st.write(
                "Allows immediate frequency analysis of the top 20 distinct values "
                "for any selected numeric feature."
            )

    else:
        st.info("Upload a CSV or JSON file to begin.")
