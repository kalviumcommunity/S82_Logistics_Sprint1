import streamlit as st

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

    st.header("Dataset Filters & Parameters")
    st.subheader("Filter Configurations")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.write("Date range filter placeholder")
    with col2:
        st.write("Category filter placeholder")
    with col3:
        st.write("Route / Region filter placeholder")

    with st.expander("Filter Criteria Guide"):
        st.write(
            "Apply multi-dimensional filters across date intervals, shipment types, "
            "origin hubs, and destination distribution centers."
        )

    st.divider()

    st.header("Data Table & Export")
    st.subheader("Export Options & Preview")
    col4, col5 = st.columns(2)
    with col4:
        st.write("Filters, data tables, and export options will appear here.")
    with col5:
        st.write("Export formats: CSV, JSON, Parquet, Excel")

    with st.expander("Data Schema & Export Settings"):
        st.write(
            "Export operations stream sanitized tracking rows with complete column schemas, "
            "including scan timestamps, hub IDs, and delay classifications."
        )
