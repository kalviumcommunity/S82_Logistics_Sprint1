# Analysis Report Guide

## What's Included

### cleaned_data.csv
- **Purpose:** Raw analysis data for further exploration in Excel
- **Rows:** 50,000 customer records
- **Columns:** customer_id, segment, churn_risk, support_interactions, response_time_hours
- **Use Case:** Stakeholders can filter, sort, and build their own pivot tables
- **Refresh:** Updated daily at 5pm

### summary_report.pdf
- **Purpose:** Executive summary suitable for meetings and email
- **Content:** Key findings, business impact, recommendations
- **Length:** 2 pages
- **Use Case:** Share with leadership, embed in presentations
- **Format:** Professional PDF with company branding

### interactive_report.html
- **Purpose:** Full analysis with interactive charts
- **Content:** All findings, all visualizations, detailed metrics
- **Size:** Single file, no dependencies (except Plotly CDN)
- **Use Case:** Explore data in browser, zoom/pan/hover to see details
- **Sharing:** Email the HTML file to anyone - it opens in any browser

## How to Use These Files
1. **For Excel analysis:** Open `cleaned_data.csv` in Excel, build your own charts
2. **For presentations:** Print or email `summary_report.pdf`
3. **For exploration:** Open `interactive_report.html` in browser, hover for tooltips
4. **For sharing:** Send `interactive_report.html` - no Python required to view

## When Are These Files Updated?
- **Daily at 5pm:** Fresh exports with latest data via scheduled task
- **On-demand:** Click "Export" button in dashboard for immediate export

## Questions?
- Data definitions: See README.md in export folder
- Analysis methodology: See technical_analysis.md
