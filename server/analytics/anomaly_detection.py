import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# =======================================================
# Task 1: Threshold-Based Anomaly Detection
# =======================================================

# Modified for Logistics Domain (Cascading Delivery Delays)
alert_rules = {
    'daily_delays': {'min': 0, 'max': 50},
    'transfer_time_hours': {'min': 1, 'max': 48},
    'missed_scans': {'min': 0, 'max': 20}
}

def check_thresholds(metrics, rules):
    """Alert if metrics outside business thresholds."""
    alerts = []
    for metric_name, rule in rules.items():
        value = metrics.get(metric_name)
        if value is not None:
            if value < rule['min']:
                alerts.append({
                    'metric': metric_name,
                    'value': value,
                    'threshold': rule['min'],
                    'direction': 'BELOW_MIN',
                    'severity': 'HIGH'
                })
            elif value > rule['max']:
                alerts.append({
                    'metric': metric_name,
                    'value': value,
                    'threshold': rule['max'],
                    'direction': 'ABOVE_MAX',
                    'severity': 'MEDIUM'
                })
    return alerts

# Test today_metrics
today_metrics = {'daily_delays': 65, 'transfer_time_hours': 12, 'missed_scans': 25}
alerts = check_thresholds(today_metrics, alert_rules)
print("--- Task 1: Threshold Alerts ---")
for alert in alerts:
    print(f"[WARNING] {alert['metric']} {alert['direction']}: {alert['value']}")

# =======================================================
# Task 2: Statistical Anomaly Detection with Z-Score
# =======================================================

def detect_anomalies_zscore(series, threshold=2):
    """Flag values > N std dev from mean."""
    mean = series.mean()
    std = series.std()
    z_scores = np.abs((series - mean) / std)
    anomalies = series[z_scores > threshold]
    return anomalies, z_scores

# Generate dummy 30-day data for 'daily_delays'
dates = pd.date_range(start='2026-07-15', periods=30)
np.random.seed(42)
delays_data = np.random.normal(loc=20, scale=5, size=30)
# Inject some anomalies
delays_data[10] = 75  # Spike in delays
delays_data[25] = 90  # Spike in delays

daily_delays = pd.Series(delays_data, index=dates)

anomalies, z_scores = detect_anomalies_zscore(daily_delays, threshold=2)

print("\n--- Task 2: Statistical Anomalies (Z-Score) ---")
print(f"Detected {len(anomalies)} anomalies out of {len(daily_delays)} days")
for date, value in anomalies.items():
    print(f"  {date.strftime('%Y-%m-%d')}: {value:.0f} delays (z-score: {z_scores[date]:.2f})")

# =======================================================
# Task 3: Severity Classification
# =======================================================

def classify_severity(value, mean, std):
    """Classify anomaly severity based on deviation."""
    z_score = abs((value - mean) / std)
    if z_score > 3:
        return 'CRITICAL'
    elif z_score > 2:
        return 'HIGH'
    elif z_score > 1.5:
        return 'MEDIUM'
    else:
        return 'LOW'

# Classify all anomalies
anomaly_severity = []
mean_delays = daily_delays.mean()
std_delays = daily_delays.std()

for date, value in anomalies.items():
    severity = classify_severity(value, mean_delays, std_delays)
    anomaly_severity.append({
        'date': date.strftime('%Y-%m-%d'),
        'value': value,
        'z_score': z_scores[date],
        'severity': severity
    })
    
severity_df = pd.DataFrame(anomaly_severity)
print("\n--- Task 3: Severity Classification ---")
print(severity_df)

# Alert only on HIGH+ severity
critical = severity_df[severity_df['severity'].isin(['CRITICAL', 'HIGH'])]
print(f"\n[WARNING] {len(critical)} critical anomalies require investigation")

# =======================================================
# Task 4: Anomaly Logging and Audit Trail
# =======================================================

# Log anomalies
anomaly_log = []
for date, value in anomalies.items():
    severity = classify_severity(value, mean_delays, std_delays)
    anomaly_log.append({
        'timestamp': pd.Timestamp.now(),
        'anomaly_date': date.strftime('%Y-%m-%d'),
        'metric': 'daily_delays',
        'value': value,
        'expected_range': f"{mean_delays-2*std_delays:.0f}-{mean_delays+2*std_delays:.0f}",
        'z_score': z_scores[date],
        'severity': severity,
        'status': 'OPEN'  # OPEN, INVESTIGATED, RESOLVED
    })

# Save to file
anomalies_df = pd.DataFrame(anomaly_log)
anomalies_df.to_csv('anomalies_log.csv', index=False)
print("\n--- Task 4: Anomaly Logging ---")
print(f"Logged {len(anomalies_df)} anomalies to 'anomalies_log.csv'")

# =======================================================
# Task 5: Visualization with Flagged Points
# =======================================================

fig, ax = plt.subplots(figsize=(14, 6))

# Plot raw data
ax.plot(daily_delays.index, daily_delays.values, marker='o', label='Daily Delays', linewidth=2)

# Plot rolling average
rolling_avg = daily_delays.rolling(window=7).mean()
ax.plot(rolling_avg.index, rolling_avg.values, label='7-day MA', color='green', linewidth=2)

# Highlight anomalies
for date, value in anomalies.items():
    ax.scatter(date, value, color='red', s=200, marker='X', zorder=5)
    ax.annotate('ANOMALY', (date, value), xytext=(0, 10), textcoords='offset points', 
                ha='center', fontweight='bold', color='red')

# Shade expected range
ax.fill_between(daily_delays.index, mean_delays-2*std_delays, mean_delays+2*std_delays, 
                alpha=0.2, color='blue', label='Expected Range ±2σ')

ax.set_xlabel('Date')
ax.set_ylabel('Number of Delays')
ax.set_title('Cascading Delivery Delays with Anomalies Flagged')
ax.legend()
ax.grid(True, alpha=0.3)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('anomaly_detection.png', dpi=150)
print("\n--- Task 5: Visualization ---")
print("Saved visualization to 'anomaly_detection.png'")
