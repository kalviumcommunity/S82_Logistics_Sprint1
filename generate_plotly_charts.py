import plotly.graph_objects as go
import pandas as pd
import numpy as np
import os

os.makedirs('interactive_charts', exist_ok=True)
np.random.seed(42)

# --- Task 1: Create Two Plotly Charts with Hover Tooltips ---

# Chart 1: Delay Trend with Custom Hover
dates = pd.date_range('2024-01-01', periods=30, freq='D')
delays = np.random.randint(10, 100, 30)
shipments = delays * 10 + np.random.randint(0, 50, 30)

fig1 = go.Figure(data=go.Scatter(
    x=dates,
    y=delays,
    mode='lines+markers',
    hovertemplate=(
        '<b>%{x|%b %d, %Y}</b><br>'
        'Delayed Shipments: %{y}<br>'
        'Total Shipments: %{customdata[0]}<br>'
        'Delay Rate: %{customdata[1]:.1f}%<br>'
        '<extra></extra>'
    ),
    customdata=np.stack((shipments, (delays/shipments)*100), axis=-1),
    line=dict(color='#d62728', width=2),
    marker=dict(size=8)
))
fig1.update_layout(
    title='Daily Network Delays (Interactive)',
    xaxis_title='Date',
    yaxis_title='Delayed Shipments',
    hovermode='x unified',
    height=500
)
fig1.write_html('interactive_charts/chart1_delay_trend.html')

# Chart 2: Route Performance with Multi-Column Hover
routes = ['Route A', 'Route B', 'Route C', 'Route D']
avg_delays = [45.2, 22.1, 15.5, 9.8]
critical_delays = [150, 45, 12, 2]
total_volume = [5000, 3200, 4100, 1500]

fig2 = go.Figure(data=go.Bar(
    x=routes,
    y=avg_delays,
    marker_color='#1f77b4',
    hovertemplate=(
        '<b>%{x}</b><br>'
        'Avg Delay: %{y} mins<br>'
        'Critical Delays (>120m): %{customdata[0]}<br>'
        'Total Volume: %{customdata[1]:,}<br>'
        '<extra></extra>'
    ),
    customdata=np.stack((critical_delays, total_volume), axis=-1)
))
fig2.update_layout(
    title='Route Performance & Cascading Risk',
    xaxis_title='Operational Route',
    yaxis_title='Average Delay (Minutes)',
    height=500
)
fig2.write_html('interactive_charts/chart2_route_performance.html')

# --- Task 2: Create Dropdown Filter to Toggle Views ---
# Toggle between Delays, Volume, and Critical Risk
fig3 = go.Figure()
fig3.add_trace(go.Bar(x=routes, y=avg_delays, name='Avg Delay', marker=dict(color='#d62728'), visible=True))
fig3.add_trace(go.Bar(x=routes, y=total_volume, name='Total Volume', marker=dict(color='#1f77b4'), visible=False))
fig3.add_trace(go.Bar(x=routes, y=critical_delays, name='Critical Risk', marker=dict(color='#ff7f0e'), visible=False))

fig3.update_layout(
    updatemenus=[dict(
        active=0,
        x=0.0, xanchor='left', y=1.15, yanchor='top',
        buttons=[
            dict(label='Avg Delay', method='update', args=[{'visible': [True, False, False]}, {'title': 'Avg Delay by Route'}]),
            dict(label='Total Volume', method='update', args=[{'visible': [False, True, False]}, {'title': 'Total Volume by Route'}]),
            dict(label='Critical Risk', method='update', args=[{'visible': [False, False, True]}, {'title': 'Critical Delays by Route'}])
        ]
    )],
    title='Route Metrics Viewer (Dropdown)',
    height=500
)
fig3.write_html('interactive_charts/chart3_metric_selector.html')

# --- Task 3: Enable Zoom, Pan, and Reset Interactions ---
# Scatter plot demonstrating default Plotly interaction capabilities
fig4 = go.Figure(data=go.Scatter(
    x=total_volume,
    y=avg_delays,
    mode='markers',
    marker=dict(size=12, color='#2ca02c'),
    text=routes,
    hovertemplate='<b>%{text}</b><br>Volume: %{x}<br>Avg Delay: %{y}<extra></extra>'
))
fig4.update_layout(
    title='Volume vs Delay (Zoom & Pan Enabled)',
    xaxis_title='Total Volume',
    yaxis_title='Average Delay',
    dragmode='zoom', 
    hovermode='closest',
    height=500
)
fig4.write_html('interactive_charts/chart4_interactive.html')

print("Interactive charts generated successfully.")
