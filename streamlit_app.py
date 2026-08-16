import streamlit as st
import plotly.graph_objects as go
import pandas as pd
import numpy as np

st.set_page_config(layout='wide', page_title='Logistics Analytics Dashboard')
st.title('Interactive Logistics Dashboard')

# Mock Data
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=100)
delays = np.random.randint(0, 120, 100)
df = pd.DataFrame({'date': dates, 'delay_minutes': delays})

# Create Interactive Plotly Figure
fig = go.Figure(data=go.Scatter(
    x=df['date'],
    y=df['delay_minutes'],
    mode='lines+markers',
    hovertemplate='<b>%{x|%b %d, %Y}</b><br>Avg Delay: %{y} mins<extra></extra>',
    line=dict(color='#d62728')
))
fig.update_layout(
    title='Daily Network Delay Trend',
    xaxis_title='Date',
    yaxis_title='Delay Minutes',
    height=500
)

# Display in Streamlit
st.plotly_chart(fig, use_container_width=True)

# Interactive Filters
st.sidebar.header('Dashboard Filters')
min_delay = st.sidebar.slider('Minimum Delay Filter (Mins)', 0, 120, 0)
filtered_df = df[df['delay_minutes'] >= min_delay]

st.write(f"Showing {len(filtered_df)} days with average delays >= {min_delay} mins")
st.dataframe(filtered_df)
