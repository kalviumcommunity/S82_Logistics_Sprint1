# Sales & Logistics Analytics Dashboard

An interactive analytics dashboard and automated data intelligence platform that ingests sales and logistics tracking data, computes operational KPIs, monitors metric thresholds with visual alerts, and delivers structured weekly reports via email. Built for operations, logistics, and sales teams to eliminate manual data wrangling and proactively detect revenue and delivery bottlenecks.

---

## 1. Overview

Traditional business monitoring relies on manual spreadsheet exports and fragmented data silos, causing delayed insight delivery and missed operational exceptions. This data product unifies the full lifecycle of data analytics into a cohesive, automated platform:
- **Interactive Streamlit Web Dashboard:** Explore dataset distributions, multi-dimensional cohort filters, and reactive KPI metrics.
- **Proactive Threshold Alerting:** Automated visual alarms (`st.error` / `st.warning`) triggering whenever critical business thresholds are crossed.
- **Last-Mile Email Dispatch:** Automated generation and delivery of structured text/CSV summary reports directly to executive inboxes using SMTP.
- **Scheduled Automated Batch Pipeline:** Headless ingestion, cleaning, aggregation, and artifact generation scheduled via GitHub Actions cron workflows.
- **Automated CI/CD Quality Gates:** GitHub Actions validation workflows preventing schema drift and blocking merges on data quality anomalies.

---

## 2. Dataset

- **Source:** Direct CSV / JSON file uploads in the dashboard or automated scheduled pipeline ingestion from `data/raw/` and `data/processed/`.
- **Primary Schema:**
  - `customer_id` (*string*): Unique customer / account identifier (e.g., `CUST-0142`).
  - `order_id` (*string*): Transaction or consignment tracking number (e.g., `ORD-1045`).
  - `amount` / `revenue` (*float*): Gross order value or transaction amount in USD (e.g., `1250.50`).
  - `date` (*datetime*): Timestamp or date of the order event (e.g., `2025-06-15`).
  - `segment` (*string*): Customer tier or operational cohort (`Enterprise`, `Mid-Market`, `SMB`, `Consumer`).
- **Refresh Cadence:** Real-time on interactive file upload; automated weekly batch refresh via GitHub Actions (`0 6 * * 1`).

---

## 3. Getting Started & Setup

Follow these exact steps to run the application from scratch in under 10 minutes:

### 1. Clone the repository
```bash
git clone https://github.com/kalviumcommunity/S82_Logistics_Sprint1.git
cd S82_Logistics_Sprint1
```

### 2. Create and activate a virtual environment
```bash
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows (Command Prompt / PowerShell):
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
# Copy the example environment configuration template
cp .env.example .env

# Edit .env with your SMTP credentials for email delivery (optional)
# SENDER_EMAIL=your-email@gmail.com
# SENDER_PASSWORD=your-app-password
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
```

### 5. Run the Streamlit application
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501` to view the interactive dashboard.

---

## 4. Pipeline Architecture

Data flows through a structured, multi-stage pipeline ensuring data integrity, schema consistency, and proactive delivery:

### Data Flow Diagram

```text
+------------------------+      +--------------------------+
| Interactive CSV Upload |  OR  | Scheduled Pipeline Batch |
+-----------+------------+      +------------+-------------+
            |                                |
            +----------------+---------------+
                             |
                             v
           +-----------------------------------+
           | Stage 1: Ingestion                |
           | Load raw data, validate format    |
           +-----------------+-----------------+
                             |
                             v
           +-----------------------------------+
           | Stage 2: Cleaning & Validation    |
           | Drop null IDs, enforce dtypes,    |
           | filter negative/invalid amounts   |
           +-----------------+-----------------+
                             |
                             v
           +-----------------------------------+
           | Stage 3: Aggregation              |
           | Group by segment, compute total   |
           | revenue, orders, avg order value  |
           +-----------------+-----------------+
                             |
                             v
           +-----------------------------------+
           | Stage 4: Output Persistence       |
           | Write cleaned.csv &               |
           | aggregated.csv to output/         |
           +-----------------+-----------------+
                             |
             +---------------+---------------+
             |                               |
             v                               v
+---------------------------+   +---------------------------+
| Interactive Dashboard     |   | Insight Sharing & Reports |
| Reactive KPIs, 3 charts,  |   | Generate 3-section text,  |
| multi-step state workflow |   | dispatch via smtplib      |
+-------------+-------------+   +---------------------------+
              |
              v
+---------------------------+
| Threshold Alert Engine    |
| Surface visual warnings   |
| (st.error / st.warning)   |
+---------------------------+
```

### Pipeline Stages

| Stage | Module | Input | Operation | Output |
| :--- | :--- | :--- | :--- | :--- |
| **1. Ingest** | `pipeline.py` / `app.py` | Raw `.csv` / `.json` | Verifies file existence, parses records with `@st.cache_data` | Pandas DataFrame |
| **2. Clean** | `pipeline.py` | Ingested DataFrame | Drops missing customer IDs/amounts, casts numeric amounts, filters `amount > 0` | Sanitized DataFrame |
| **3. Aggregate** | `pipeline.py` | Cleaned DataFrame | Groups by `segment`, aggregates `revenue`, `orders`, and `avg_order` | Segment Summary DataFrame |
| **4. Output** | `pipeline.py` | Cleaned & Aggregated Data | Exports data to `output/cleaned.csv` and `output/aggregated.csv` | CSV Artifacts |
| **5. Dashboard** | `app.py` | Active / Filtered DataFrame | Evaluates reactive 5-KPI bar, renders 3 charts (line, bar, histogram) | Streamlit UI |
| **6. Alerts** | `app.py` | `ALERT_THRESHOLDS` | Checks metrics against critical/warning limits, displays visual alerts | `st.error` / `st.warning` |
| **7. Reports** | `report_generator.py` | Filtered DataFrame | Generates structured text report with KPIs, findings, and recommendations | Text & Email Report |
| **8. Validation**| `validate_data.py` | `cleaned_data.csv` | Enforces column existence, numeric types, `>=100` rows, zero null columns | Exit Code 0 / 1 (CI Gate) |

---

## 5. Derived Features

The platform derives and calculates the following engineered attributes across data processing, dashboard exploration, and reporting:

| Column / Metric | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `revenue_30d` | `float` | Cumulative sum of order revenue generated in the trailing 30-day window | `4523.50` |
| `days_since_order` | `integer` | Elapsed days since the customer's most recent completed order event | `12` |
| `churn_risk` | `string` | Categorical risk rating inferred from transit delays and engagement recency | `"high"` |
| `null_pct` | `float` | Overall missing cell ratio across evaluated dataset or column | `2.3` |
| `total_revenue` | `float` | Dynamic sum of transaction revenue across active filter criteria | `942500.0` |
| `avg_order` | `float` | Mean transaction value per record across filtered cohort | `1250.75` |
| `unique_customers` | `integer` | Count of distinct active customer entities in the filtered cohort | `240` |
| `quality_pct` | `float` | Overall data completeness score (`100.0 - null_pct`) | `98.5` |
| `top_segment` | `string` | Highest revenue generating segment identified in report generation | `"Enterprise"` |

---

## 6. Known Limitations

- **Scheduled Batch Refresh:** The headless automated pipeline runs on a weekly schedule (`0 6 * * 1`). The dashboard reflects dataset uploads or weekly refreshes rather than real-time sub-second streaming updates (maximum staleness: 7 days).
- **Refund Exclusion:** The revenue metric computes gross transaction value and currently excludes post-fulfillment refund/chargeback adjustments.
- **Cohort Classification:** Customer segment assignment relies on the categorical `segment` attribute; dynamic behavioral re-segmentation across rolling windows is not yet computed.
- **Static Threshold Boundaries:** Alert thresholds in `ALERT_THRESHOLDS` are statically defined (e.g. churn > 7.0%, AOV < $30.0) without seasonal variance modeling.
- **SMTP Credential Dependency:** Automated email delivery requires valid SMTP credentials in `.env` or system environment variables. If unconfigured, email sending is skipped with a logged error while dashboard operations continue unaffected.
- **Schema Assumptions:** The automated batch pipeline expects input files to supply customer, amount, date, and segment attributes (or standard synonyms).

---

## 7. Full Usage & Operational Guide

### Interactive Dashboard Exploration (`app.py`)
- **Navigation:** Switch between **Business Overview**, **Trend Analysis**, and **Data Explorer** using the sidebar radio controller.
- **Dynamic Filtering:** Adjust the **Date Range Picker**, **Segment Multi-Select**, and **Revenue Range Slider** in the sidebar. All downstream metrics and charts recalculate instantly.
- **Filter Reset:** Click `Reset Filters` in the sidebar to return all filter widgets to their full dataset defaults.
- **Multi-Step Workflow:** Navigate to `Trend Analysis`, select a cohort in **Step 1: Select Segment**, click `Confirm Segment`, and explore cached segment analytics in **Step 2: Analysis**. State persists across filter modifications. Click `Reset Workflow` to clear.
- **Visual Threshold Alerts:** If Churn Rate > 7.0% (`critical`), AOV < $30.0 (`warning`), or Data Quality < 95.0% (`warning`), visual alert banners display at the top of the dashboard.
- **Insight Sharing & Email Delivery:** Enter a recipient email in the sidebar **Report Actions** panel and click `Send Report` to dispatch a structured 3-section summary report. Click `Download CSV` to export filtered rows.

### Automated Batch Pipeline (`pipeline.py`)
Execute the automated 4-stage pipeline directly via CLI:
```bash
python pipeline.py --input data/processed/cleaned_data.csv --output output
```
This generates `output/cleaned.csv` and `output/aggregated.csv` with timestamped logs.

### Schema Validation CI Gate (`validate_data.py`)
Run automated schema and quality contract validation:
```bash
python validate_data.py data/processed/cleaned_data.csv
```
Returns exit code `0` on success or exit code `1` on failure, preventing bad schema merges in GitHub Actions CI/CD workflows.
