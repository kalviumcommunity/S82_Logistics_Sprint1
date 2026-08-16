# Plotly Interactive Chart Design - Follow-Up Question

## Question
You have a time-series Plotly chart showing revenue (or in our logistics case, network delays) by week. You want to add a date range slider so users can select which weeks to view (e.g., "show me only Q1 2024"). How would you implement this in Plotly?

## Answer
To implement date range exploration in Plotly time-series charts, you have two primary, built-in features that can be used together or independently:

### 1. Range Slider (Drag-to-select on the X-Axis)
The `rangeslider` creates a mini-chart at the bottom of the main visualization. Users can drag the handles left and right to zoom into a custom date range continuously.

### 2. Range Selector Buttons (Pre-defined Periods)
The `rangeselector` creates a row of clickable buttons (e.g., "1M", "YTD", "Q1") above the chart, allowing users to instantly jump to specific temporal periods.

### Code Implementation Example:
```python
fig.update_xaxes(
    # 1. Range Selector Buttons
    rangeselector=dict(
        buttons=list([
            dict(count=1, label='1M', step='month', stepmode='backward'),
            dict(count=3, label='Q1 / 3M', step='month', stepmode='backward'),
            dict(count=6, label='6M', step='month', stepmode='backward'),
            dict(step='all', label='All Time')
        ])
    ),
    # 2. Range Slider
    rangeslider=dict(visible=True)
)
```

### When is each approach better?
- **Range Selector Buttons** are better when stakeholders have standard reporting periods they check frequently (e.g., "Last 30 days", "QTD"). It requires one click and guarantees exact date alignment.
- **Range Slider** is better for exploratory data analysis (EDA), where an analyst notices an anomaly in a long time-series and needs to fluidly drag and zoom to isolate a non-standard 12-day window (e.g., during a specific supply chain disruption event).
