import streamlit as st
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import os

# Ensure output directory exists for saving charts
os.makedirs('output', exist_ok=True)

st.set_page_config(layout='wide', page_title='Logistics Delay Prediction Dashboard')
st.title('Logistics Delay Prediction Dashboard')

# Mock data generation
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=100)
routes = ['Route A', 'Route B', 'Route C', 'Route D']

df = pd.DataFrame({
    'date': np.random.choice(dates, 1000),
    'shipment_id': [f'SHP{i:05d}' for i in range(1000)],
    'route': np.random.choice(routes, 1000, p=[0.4, 0.3, 0.2, 0.1]),
    'status': np.random.choice(['On-Time', 'Delayed'], 1000, p=[0.85, 0.15]),
    'delay_hours': np.random.exponential(scale=5, size=1000) * np.random.choice([0, 1], 1000, p=[0.85, 0.15])
})

# Level 1: KPI Summary Cards
st.subheader('Level 1: System Status')
col1, col2, col3, col4, col5 = st.columns(5)
with col1:
    st.metric(label='Total Shipments', value='1,000', delta='+5.2%')
with col2:
    st.metric(label='Delayed Shipments', value='150', delta='-2.1%', delta_color='inverse')
with col3:
    st.metric(label='Avg Delay (Hours)', value='4.2', delta='-0.5', delta_color='inverse')
with col4:
    st.metric(label='Routes w/ Cascading Delays', value='2', delta='+1', delta_color='inverse')
with col5:
    st.metric(label='On-Time Delivery Rate', value='85%', delta='+2.5%')

st.divider()

# Level 2: Trends
st.subheader('Level 2: Delay Trends')
col_t1, col_t2 = st.columns(2)

with col_t1:
    # Chart 1: Delay Trend
    months = pd.date_range('2024-01-01', periods=12, freq='M')
    delays = [15, 18, 14, 12, 10, 8, 11, 13, 16, 14, 12, 10]
    
    fig1, ax1 = plt.subplots(figsize=(10, 4))
    ax1.plot(months, delays, marker='o', linewidth=2, color='#d62728')
    ax1.set_title('Monthly Delayed Shipments Trend (2024)', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Month')
    ax1.set_ylabel('Delayed Shipments')
    ax1.grid(True, alpha=0.3)
    ax1.axhline(y=10, color='green', linestyle='--', linewidth=1.5, label='Target: 10')
    ax1.legend()
    plt.tight_layout()
    plt.savefig('output/delay_trend.png', dpi=300)
    st.pyplot(fig1)

with col_t2:
    # Chart 2: Shipments vs Delays
    shipments = [100, 110, 105, 95, 120, 130, 125, 115, 140, 135, 130, 125]
    fig2, ax2 = plt.subplots(figsize=(10, 4))
    ax2.plot(months, shipments, marker='s', linewidth=2, color='#1f77b4', label='Total Shipments')
    ax2.plot(months, delays, marker='o', linewidth=2, color='#d62728', label='Delays')
    ax2.set_title('Shipments vs Delays', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Month')
    ax2.set_ylabel('Count')
    ax2.grid(True, alpha=0.3)
    ax2.legend()
    plt.tight_layout()
    plt.savefig('output/shipments_vs_delays.png', dpi=300)
    st.pyplot(fig2)

st.divider()

# Level 3: Segments
st.subheader('Level 3: Route Segments')
# Chart 3: Delays by Route
route_names = ['Route A', 'Route B', 'Route C', 'Route D']
route_delays = [60, 45, 30, 15]
route_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']

fig3, ax3 = plt.subplots(figsize=(10, 4))
bars = ax3.barh(route_names, route_delays, color=route_colors)
ax3.set_xlabel('Delayed Shipments')
ax3.set_title('Delays by Operational Route', fontsize=12, fontweight='bold')

for bar, val in zip(bars, route_delays):
    ax3.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2, str(val), va='center')

plt.tight_layout()
plt.savefig('output/delays_by_route.png', dpi=300)
st.pyplot(fig3)

st.divider()

# Level 4: Detail
st.subheader('Level 4: Detailed Data Explorer')

st.sidebar.header('Filters')
selected_route = st.sidebar.selectbox('Operational Route', ['All'] + routes)
status_filter = st.sidebar.selectbox('Shipment Status', ['All', 'On-Time', 'Delayed'])

filtered_df = df.copy()
if selected_route != 'All':
    filtered_df = filtered_df[filtered_df['route'] == selected_route]
if status_filter != 'All':
    filtered_df = filtered_df[filtered_df['status'] == status_filter]

st.write(f'Showing {len(filtered_df):,} records')
st.dataframe(filtered_df[['shipment_id', 'date', 'route', 'status', 'delay_hours']])

csv = filtered_df.to_csv(index=False)
st.download_button(
    label='Download CSV',
    data=csv,
    file_name='logistics_filtered_data.csv',
    mime='text/csv'
)
