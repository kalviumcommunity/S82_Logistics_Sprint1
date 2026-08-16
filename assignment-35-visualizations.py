import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

# Create output directory if it doesn't exist
os.makedirs('output', exist_ok=True)

# 1. Define Consistent Company Colour Palette (Logistics Theme)
PALETTE = {
    'primary': '#1f77b4',    # Blue - standard metric
    'secondary': '#ff7f0e',  # Orange - secondary metric
    'success': '#2ca02c',    # Green - On-Time
    'danger': '#d62728',     # Red - Delayed
    'neutral': '#7f7f7f'     # Gray - background/baseline
}
CHART_COLORS = [PALETTE['primary'], PALETTE['secondary'], PALETTE['success'], PALETTE['danger'], '#9467bd']

# Mock Data Generation for Logistics Delay Analysis
np.random.seed(42)

# --- Chart 1: Bar Chart (Comparison) - Total Delays by Route ---
routes = ['Route A', 'Route B', 'Route C', 'Route D', 'Route E']
delays = [450, 320, 210, 150, 90]

fig1, ax1 = plt.subplots(figsize=(10, 6))
ax1.barh(routes, delays, color=PALETTE['danger'])
ax1.set_xlabel('Total Delayed Shipments', fontsize=12)
ax1.set_ylabel('Operational Route', fontsize=12)
ax1.set_title('Q4 Delayed Shipments by Route', fontsize=14, fontweight='bold')
ax1.annotate('Highest Bottleneck\nRequires Intervention', 
             xy=(450, 0), xytext=(350, 0.8),
             arrowprops=dict(arrowstyle='->', color='black', lw=2),
             fontsize=11, ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))
plt.tight_layout()
plt.savefig('output/chart1_delays_by_route.png', dpi=300, bbox_inches='tight')
plt.close()

# --- Chart 2: Line Chart (Trend) - Delay Trend over 12 Months ---
months = pd.date_range('2023-01-01', periods=12, freq='M')
trend_route_a = [30, 35, 40, 45, 60, 80, 120, 90, 70, 60, 50, 45]
trend_route_b = [20, 22, 25, 28, 30, 35, 40, 38, 35, 30, 28, 25]

fig2, ax2 = plt.subplots(figsize=(12, 6))
ax2.plot(months, trend_route_a, marker='o', linewidth=2, color=PALETTE['danger'], label='Route A')
ax2.plot(months, trend_route_b, marker='s', linewidth=2, color=PALETTE['secondary'], label='Route B')
ax2.set_xlabel('Month', fontsize=12)
ax2.set_ylabel('Delayed Shipments Count', fontsize=12)
ax2.set_title('Monthly Delay Trend (Last 12 Months)', fontsize=14, fontweight='bold')
ax2.legend(loc='upper left', fontsize=11)
ax2.grid(True, alpha=0.3)
ax2.axhline(y=50, color=PALETTE['success'], linestyle='--', linewidth=2, label='Acceptable Threshold')
# Annotation
ax2.annotate('Severe Weather\nDisruption', 
             xy=(months[6], 120), xytext=(months[5], 135),
             arrowprops=dict(arrowstyle='->', color='black', lw=2),
             fontsize=11, ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))
ax2.legend(loc='upper left', fontsize=11)
plt.tight_layout()
plt.savefig('output/chart2_delay_trend.png', dpi=300, bbox_inches='tight')
plt.close()

# --- Chart 3: Histogram (Distribution) - Delay Times Distribution ---
delay_times = np.random.exponential(scale=45, size=1000)

fig3, ax3 = plt.subplots(figsize=(10, 6))
ax3.hist(delay_times, bins=30, color=PALETTE['primary'], edgecolor='black', alpha=0.7)
ax3.set_xlabel('Delay Duration (Minutes)', fontsize=12)
ax3.set_ylabel('Frequency (Shipments)', fontsize=12)
ax3.set_title('Distribution of Shipment Delay Durations', fontsize=14, fontweight='bold')
ax3.axvline(x=120, color=PALETTE['danger'], linestyle='--', linewidth=2, label='Critical Delay Threshold (>120m)')
ax3.legend(loc='upper right')
ax3.annotate('Long-tail cascading\ndelays', 
             xy=(200, 20), xytext=(250, 60),
             arrowprops=dict(arrowstyle='->', color='black', lw=2),
             fontsize=11, ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))
plt.tight_layout()
plt.savefig('output/chart3_delay_distribution.png', dpi=300, bbox_inches='tight')
plt.close()

# --- Chart 4: Stacked Bar (Composition) - Total Volume vs Status ---
quarters = ['Q1', 'Q2', 'Q3', 'Q4']
on_time = np.array([5000, 5200, 4800, 5500])
delayed = np.array([400, 450, 800, 600])

fig4, ax4 = plt.subplots(figsize=(10, 6))
ax4.bar(quarters, on_time, color=PALETTE['success'], label='On-Time')
ax4.bar(quarters, delayed, bottom=on_time, color=PALETTE['danger'], label='Delayed')
ax4.set_xlabel('Quarter', fontsize=12)
ax4.set_ylabel('Shipment Volume', fontsize=12)
ax4.set_title('Shipment Volume and Delay Composition by Quarter', fontsize=14, fontweight='bold')
ax4.legend(loc='upper left')
ax4.annotate('Q3 Supply Chain\nDisruption', 
             xy=(2, 5200), xytext=(2, 6500),
             arrowprops=dict(arrowstyle='->', color='black', lw=2),
             fontsize=11, ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))
# Data labels for the delayed portion to highlight the severity
for i, v in enumerate(delayed):
    ax4.text(i, on_time[i] + v/2, str(v), color='white', fontweight='bold', ha='center', va='center')
plt.tight_layout()
plt.savefig('output/chart4_shipment_composition.png', dpi=300, bbox_inches='tight')
plt.close()

# --- Chart 5: Scatter Plot (Correlation) - Transfer Volume vs Avg Delay ---
transfer_volume = np.random.normal(500, 100, 50)
avg_delay = transfer_volume * 0.15 + np.random.normal(0, 15, 50)

fig5, ax5 = plt.subplots(figsize=(10, 6))
ax5.scatter(transfer_volume, avg_delay, color=PALETTE['primary'], alpha=0.7, edgecolors='black')
# Trend line
z = np.polyfit(transfer_volume, avg_delay, 1)
p = np.poly1d(z)
ax5.plot(transfer_volume, p(transfer_volume), color=PALETTE['secondary'], linestyle='--', linewidth=2, label='Trend (r=0.82)')

ax5.set_xlabel('Daily Warehouse Transfer Volume (Shipments)', fontsize=12)
ax5.set_ylabel('Average Delay Time (Minutes)', fontsize=12)
ax5.set_title('Correlation: Warehouse Volume vs Cascading Delays', fontsize=14, fontweight='bold')
ax5.legend(loc='upper left')
# Highlight Outlier
max_idx = np.argmax(avg_delay)
ax5.annotate('System Overload\n(Outlier)', 
             xy=(transfer_volume[max_idx], avg_delay[max_idx]), 
             xytext=(transfer_volume[max_idx]-100, avg_delay[max_idx]+10),
             arrowprops=dict(arrowstyle='->', color=PALETTE['danger'], lw=2),
             fontsize=11, ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))
plt.tight_layout()
plt.savefig('output/chart5_volume_vs_delay.png', dpi=300, bbox_inches='tight')
plt.close()

print("All charts generated and saved to the 'output/' directory successfully.")
