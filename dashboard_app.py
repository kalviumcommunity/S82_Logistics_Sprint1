import streamlit as st
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import sqlite3
import os

os.makedirs('output', exist_ok=True)

st.set_page_config(layout='wide', page_title='Logistics Delay Prediction Dashboard')
st.title('Logistics Delay Prediction Dashboard')

# --- 1. Database Setup & Mock Data ---
engine = sqlite3.connect(':memory:')

engine.execute('''CREATE TABLE shipment_logs (
    log_id INTEGER, 
    scan_date DATE, 
    route_name TEXT, 
    total_shipments INTEGER, 
    delayed_shipments INTEGER, 
    avg_delay_hours NUMERIC
)''')

# Insert dummy data spanning multiple months
np.random.seed(42)
months = pd.date_range('2023-01-01', periods=12, freq='M')
routes = ['Route A', 'Route B', 'Route C', 'Route D']

mock_data = []
log_id = 1
for month in months:
    for route in routes:
        total = int(np.random.normal(1000, 200))
        delayed = int(np.random.normal(100, 30))
        delay_hrs = round(np.random.uniform(1.0, 5.0), 2)
        mock_data.append((log_id, month.strftime('%Y-%m-%d'), route, total, delayed, delay_hrs))
        log_id += 1

engine.executemany('INSERT INTO shipment_logs VALUES (?, ?, ?, ?, ?, ?)', mock_data)

# --- 2. SQL Queries with Window Functions ---

# KPI Query: Use LAG to calculate month-over-month changes
kpi_query = """
WITH monthly_stats AS (
    SELECT 
        strftime('%Y-%m', scan_date) as month,
        SUM(total_shipments) as total_volume,
        SUM(delayed_shipments) as total_delayed,
        AVG(avg_delay_hours) as network_avg_delay
    FROM shipment_logs
    GROUP BY month
),
mom_comparison AS (
    SELECT 
        month,
        total_volume,
        LAG(total_volume) OVER (ORDER BY month) as prev_volume,
        total_delayed,
        LAG(total_delayed) OVER (ORDER BY month) as prev_delayed,
        network_avg_delay,
        LAG(network_avg_delay) OVER (ORDER BY month) as prev_delay
    FROM monthly_stats
)
SELECT * FROM mom_comparison ORDER BY month DESC LIMIT 1;
"""
kpi_df = pd.read_sql(kpi_query, engine)

# Trend Query: Use LEAD to find next month's value (useful for forecasting/comparisons)
trend_query = """
SELECT 
    scan_date,
    SUM(delayed_shipments) as delayed,
    LEAD(SUM(delayed_shipments)) OVER (ORDER BY scan_date) as next_month_delayed
FROM shipment_logs
GROUP BY scan_date
ORDER BY scan_date;
"""
trend_df = pd.read_sql(trend_query, engine)

# Ranking Query: Use RANK and ROW_NUMBER to find the worst performing routes
ranking_query = """
WITH route_delays AS (
    SELECT 
        route_name,
        SUM(delayed_shipments) as total_delayed
    FROM shipment_logs
    WHERE scan_date >= '2023-10-01' -- Last quarter
    GROUP BY route_name
)
SELECT 
    route_name,
    total_delayed,
    RANK() OVER (ORDER BY total_delayed DESC) as delay_rank,
    ROW_NUMBER() OVER (ORDER BY total_delayed DESC) as absolute_position
FROM route_delays
ORDER BY delay_rank;
"""
rank_df = pd.read_sql(ranking_query, engine)

# --- 3. Dashboard UI ---

# Level 1: KPI Summary Cards (Using LAG results)
st.subheader('Level 1: System Status (Month-over-Month)')
col1, col2, col3, col4, col5 = st.columns(5)

curr_vol = kpi_df.iloc[0]['total_volume']
prev_vol = kpi_df.iloc[0]['prev_volume']
curr_del = kpi_df.iloc[0]['total_delayed']
prev_del = kpi_df.iloc[0]['prev_delayed']
curr_avg = kpi_df.iloc[0]['network_avg_delay']
prev_avg = kpi_df.iloc[0]['prev_delay']

with col1:
    st.metric(label='Total Shipments', value=f"{curr_vol:,.0f}", delta=f"{((curr_vol-prev_vol)/prev_vol)*100:.1f}%")
with col2:
    st.metric(label='Delayed Shipments', value=f"{curr_del:,.0f}", delta=f"{((curr_del-prev_del)/prev_del)*100:.1f}%", delta_color='inverse')
with col3:
    st.metric(label='Avg Delay (Hours)', value=f"{curr_avg:.1f}", delta=f"{curr_avg-prev_avg:.1f} hrs", delta_color='inverse')
with col4:
    st.metric(label='Worst Route Rank 1', value=rank_df.iloc[0]['route_name'])
with col5:
    st.metric(label='Worst Route Rank 2', value=rank_df.iloc[1]['route_name'])

st.divider()

# Level 2: Trends (Using LEAD results for comparison context)
st.subheader('Level 2: Delay Trends')
col_t1, col_t2 = st.columns(2)

with col_t1:
    fig1, ax1 = plt.subplots(figsize=(10, 4))
    ax1.plot(pd.to_datetime(trend_df['scan_date']), trend_df['delayed'], marker='o', linewidth=2, color='#d62728', label='Current Month')
    ax1.set_title('Monthly Delayed Shipments Trend', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Month')
    ax1.set_ylabel('Delayed Shipments')
    ax1.grid(True, alpha=0.3)
    ax1.legend()
    plt.tight_layout()
    plt.savefig('output/delay_trend.png', dpi=300)
    st.pyplot(fig1)

# Level 3: Segments (Using RANK & ROW_NUMBER results)
st.subheader('Level 3: Route Delay Rankings (Q4)')

fig3, ax3 = plt.subplots(figsize=(10, 4))
colors = ['#d62728' if r == 1 else '#ff7f0e' if r == 2 else '#1f77b4' for r in rank_df['delay_rank']]
bars = ax3.barh(rank_df['route_name'], rank_df['total_delayed'], color=colors)
ax3.invert_yaxis()  # Rank 1 at the top
ax3.set_xlabel('Delayed Shipments')
ax3.set_title('Worst Performing Routes by Delay Rank', fontsize=12, fontweight='bold')

for bar, rank, val in zip(bars, rank_df['delay_rank'], rank_df['total_delayed']):
    ax3.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2, f"Rank {rank} ({val})", va='center')

plt.tight_layout()
plt.savefig('output/delays_by_route_ranked.png', dpi=300)
st.pyplot(fig3)

st.divider()

# Level 4: Detail
st.subheader('Level 4: Detailed Data Explorer')
st.dataframe(rank_df)
