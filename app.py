import streamlit as st
import pandas as pd
import numpy as np

st.set_page_config(page_title="Logistics Delay Explorer", layout="wide")

st.title("Logistics Delay & Costs Explorer")
st.markdown("""
*Domain Context: For this logistics application, "segment" represents operational routes (e.g., Enterprise routes, SMB routes), and "revenue" represents the logistics penalty costs associated with cascading delivery delays.*
""")

# Upload data
uploaded_file = st.sidebar.file_uploader("Upload Shipment Data CSV", type=["csv"])

if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)
    df['date'] = pd.to_datetime(df['date']).dt.date
else:
    # Generate mock data aligned with logistics domain if no file is uploaded
    st.info("No file uploaded. Using default logistics mock data.")
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', '2023-12-31').date
    segments = ['Route A', 'Route B', 'Route C', 'Warehouse Transfer']
    df = pd.DataFrame({
        'date': np.random.choice(dates, 500),
        'segment': np.random.choice(segments, 500),
        'revenue': np.random.randint(100, 10000, 500) # Representing penalty costs
    })

st.sidebar.header("Filters")

# Widget 1: Date range picker
date_range = st.sidebar.date_input(
    "Date Range", 
    value=(df["date"].min(), df["date"].max())
)

# Widget 2: Multi-select for segments
all_segments = df["segment"].unique().tolist()
selected_segments = st.sidebar.multiselect(
    "Segments", 
    options=all_segments, 
    default=all_segments
)

# Widget 3: Revenue slider
min_rev, max_rev = st.sidebar.slider(
    "Revenue Range", 
    min_value=int(df["revenue"].min()), 
    max_value=int(df["revenue"].max()), 
    value=(int(df["revenue"].min()), int(df["revenue"].max()))
)

# Task 5: Implement Filter Reset
if st.sidebar.button("Reset Filters"):
    st.rerun()

# Check if date range is valid (has both start and end)
if len(date_range) == 2:
    filtered_df = df[
        (df["date"] >= pd.Timestamp(date_range[0]).date()) & 
        (df["date"] <= pd.Timestamp(date_range[1]).date()) & 
        (df["segment"].isin(selected_segments)) & 
        (df["revenue"] >= min_rev) & 
        (df["revenue"] <= max_rev)
    ]
    
    # Task 4: Handle Empty Filter Combinations
    if len(filtered_df) == 0:
        st.warning("No data matches the current filters. Try broadening your selection.")
        st.stop()
        
    st.write(f"Showing {len(filtered_df):,} of {len(df):,} records")
    st.dataframe(filtered_df.head(20), use_container_width=True)
    
    st.subheader("Cost/Penalty by Route Segment")
    chart_data = filtered_df.groupby('segment')['revenue'].sum()
    st.bar_chart(chart_data)
else:
    st.warning("Please select a complete date range.")
