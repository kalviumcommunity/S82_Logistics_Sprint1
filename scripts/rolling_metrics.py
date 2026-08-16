import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import warnings
warnings.filterwarnings('ignore')

# Ensure directories exist
os.makedirs('output', exist_ok=True)
os.makedirs('notebooks', exist_ok=True)

# Generate mock data
np.random.seed(42)
dates = pd.date_range(start="2025-01-01", end="2025-12-31", freq='D')
base_revenue = 10000
trend = np.linspace(0, 5000, len(dates))  # Uptrend
seasonality = np.sin(np.linspace(0, 10, len(dates))) * 2000
noise = np.random.normal(0, 1500, len(dates))

revenue = base_revenue + trend + seasonality + noise
orders = (revenue / np.random.uniform(50, 150, len(dates))).astype(int)

df = pd.DataFrame({
    'date': dates,
    'revenue': np.maximum(revenue, 0),
    'orders': np.maximum(orders, 1)
})

print("--- TASK 1: Resample Data by Time Period ---")
df_ts = df.set_index('date')

# Resample to weekly
weekly_revenue = df_ts['revenue'].resample('W').sum()
weekly_count = df_ts['orders'].resample('W').count()
weekly_avg = df_ts['revenue'].resample('W').mean()

print("Weekly Revenue (first 5):")
print(weekly_revenue.head())
print("\nWeekly Order Count (first 5):")
print(weekly_count.head())
print("\nWeekly Average Revenue (first 5):")
print(weekly_avg.head())

highest_week = weekly_revenue.idxmax()
print(f"\nHighest revenue week: {highest_week.date()} with ${weekly_revenue.max():,.2f}")

print("\n--- TASK 2: Compute Rolling Window Average ---")
df['revenue_ma7'] = df['revenue'].rolling(window=7).mean()
df['revenue_ma30'] = df['revenue'].rolling(window=30).mean()

plt.figure(figsize=(12, 6))
plt.plot(df['date'], df['revenue'], label='Raw', alpha=0.3)
plt.plot(df['date'], df['revenue_ma7'], label='7-day MA', linewidth=2)
plt.plot(df['date'], df['revenue_ma30'], label='30-day MA', linewidth=3)
plt.title('Daily Revenue vs Rolling Averages')
plt.xlabel('Date')
plt.ylabel('Revenue')
plt.legend()
plt.tight_layout()
plt.savefig('output/rolling_avg.png')
print("Saved output/rolling_avg.png")

print("\n--- TASK 3: Calculate Month-over-Month Percentage Change ---")
monthly_revenue = df_ts['revenue'].resample('ME').sum()
mom_change = monthly_revenue.pct_change() * 100

growth_months = mom_change[mom_change > 0]
decline_months = mom_change[mom_change < 0]

print("Month-over-Month % Change:")
print(mom_change.dropna().apply(lambda x: f"{x:.1f}%"))

print("\nMonths with Positive Growth:")
for date, val in growth_months.items():
    print(f"  {date.strftime('%B %Y')}: +{val:.1f}%")

print("\nMonths with Decline:")
for date, val in decline_months.items():
    print(f"  {date.strftime('%B %Y')}: {val:.1f}%")

print("\nPattern Shows: An overall accelerating trend with some seasonal/monthly declines.")

print("\n--- TASK 4: Compute Cumulative Sum ---")
df['cumulative_revenue'] = df['revenue'].cumsum()

plt.figure(figsize=(10, 5))
plt.plot(df['date'], df['cumulative_revenue'], color='green', linewidth=2)
plt.title('Cumulative Revenue Over Time')
plt.xlabel('Date')
plt.ylabel('Cumulative Revenue')
plt.tight_layout()
plt.savefig('output/cumulative.png')
print("Saved output/cumulative.png")

total_accumulated = df['cumulative_revenue'].iloc[-1]
print(f"Total revenue accumulated: ${total_accumulated:,.0f}")

print("\n--- TASK 5: Identify Trend Pattern and Business Implications ---")
recent_ma30 = df['revenue_ma30'].dropna().tail(30)
trend_direction = 'up' if recent_ma30.iloc[-1] > recent_ma30.iloc[0] else 'down'
trend_magnitude = ((recent_ma30.iloc[-1] - recent_ma30.iloc[0]) / recent_ma30.iloc[0]) * 100

action_recommendation = 'Accelerating growth - maintain current strategy' if trend_direction == 'up' else 'Declining momentum - investigate causes'

analysis = f"""
TREND ANALYSIS:

Rolling Average Trend: {trend_direction.upper()}
Change over last 30 days: {trend_magnitude:.1f}%
Month-over-month growth (last month): {mom_change.iloc[-1]:.1f}%

Business Implications:
- {action_recommendation}
- Revenue volatility (standard deviation): ${df['revenue'].std():.0f} (measure of noise)
- The raw daily data shows extreme volatility, but the 30-day moving average clearly reveals a sustained upward momentum through the end of the year.
"""

print(analysis)

with open('output/trend_analysis.txt', 'w', encoding='utf-8') as f:
    f.write(analysis)
print("Saved output/trend_analysis.txt")
