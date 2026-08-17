# Standardized KPI Definition & Governance Framework

This document establishes the single source of truth for key performance indicators (KPIs) across Finance, Product, Sales, Operations, and Customer Success. All reporting engines, analytics dashboards, and data models must adhere to these standardized definitions, target ranges, formulas, operational owners, and data governance rules.

---

## Executive Summary Matrix

| Metric Name | Operational Owner | Frequency | Target Range | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Active Users (MAU)** | Product Manager | Daily | 5,000 – 6,000 | Core transaction and shipment logs |
| **Average Revenue Per Customer (ARPC)** | Finance Lead | Weekly | $90.00 – $110.00 | Orders and financial transaction tables |
| **Monthly Churn Rate** | Customer Success Lead | Monthly | 0.0% – 5.0% | Customer activity logs |
| **Payment Success Rate (PSR)** | Infrastructure Lead | Real-Time / Hourly | 95.0% – 100.0% | Payment gateway logs |
| **Customer Acquisition Cost (CAC)** | Growth Marketing Lead | Monthly | $0.00 – $50.00 | Acquisition cost ledgers & first-purchase customer records |
| **Net Revenue Retention (NRR)** | Chief Revenue Officer | Monthly | 105.0% – 125.0% | Subscription ledgers table |

---

## Core KPI Specification Reference

### 1. Monthly Active Users (MAU)
- **Definition:** Distinct customers with at least one completed transaction or verified shipment event in the last 30 days.
- **Formula:** 
  $$\text{MAU} = \text{COUNT}(\text{DISTINCT } \text{customer\_id}) \quad \text{WHERE } \text{status} = \text{'completed'} \text{ AND } \text{transaction\_date} \ge \text{TODAY}() - 30\text{ days}$$
- **Data Source:** Core transaction and shipment logs (`customer_id`, `transaction_date`, `status`)
- **Target Range:** 5,000 – 6,000
- **Owner:** Product Manager
- **Frequency:** Daily
- **Governance Notes:** Measures active engagement; filters unverified email leads or non-completed transactions.

---

### 2. Average Revenue Per Customer (ARPC)
- **Definition:** Total completed order sales divided by distinct active customers.
- **Formula:** 
  $$\text{ARPC} = \frac{\sum \text{amount}}{\text{COUNT}(\text{DISTINCT } \text{customer\_id})} \quad \text{WHERE } \text{status} = \text{'completed'}$$
- **Data Source:** Orders and financial transaction tables (`amount`, `customer_id`, `status`)
- **Target Range:** $90.00 – $110.00
- **Owner:** Finance Lead
- **Frequency:** Weekly
- **Governance Notes:** Key indicator of customer monetization depth across completed payment events.

---

### 3. Monthly Churn Rate
- **Definition:** Percentage of active customers in Period 1 (days -60 to -30) with zero transaction or shipment activity in Period 2 (last 30 days).
- **Formula:** 
  $$\text{Churn Rate} = \frac{\text{Active}_{P1} - \text{Active}_{P2 \mid P1}}{\text{Active}_{P1}}$$
- **Data Source:** Customer activity logs (`customer_id`, `transaction_date`, `status`)
- **Target Range:** 0.0% – 5.0%
- **Owner:** Customer Success Lead
- **Frequency:** Monthly
- **Governance Notes:** Tracks account attrition and customer retention risk. Measures loss of active customer base over sequential 30-day windows.

---

### 4. Payment Success Rate (PSR)
- **Definition:** Ratio of successful completed checkout transactions over total payment attempts.
- **Formula:** 
  $$\text{PSR} = \frac{\text{COUNT}(\text{transactions WHERE } \text{status} = \text{'completed'})}{\text{COUNT}(\text{total\_transactions})}$$
- **Data Source:** Payment gateway logs (`transaction_id`, `status`)
- **Target Range:** 95.0% – 100.0%
- **Owner:** Infrastructure Lead
- **Frequency:** Real-Time / Hourly
- **Governance Notes:** Technical health metric for checkout authorization efficiency and gateway performance.

---

### 5. Customer Acquisition Cost (CAC)
- **Definition:** Total sales and marketing spend divided by net-new paying customer additions.
- **Formula:** 
  $$\text{CAC} = \frac{\sum \text{marketing\_spend}}{\text{COUNT}(\text{DISTINCT } \text{new\_paying\_customers})}$$
- **Data Source:** Acquisition cost ledgers & first-purchase customer records (`spend`, `customer_id`, `first_purchase_date`)
- **Target Range:** $0.00 – $50.00
- **Owner:** Growth Marketing Lead
- **Frequency:** Monthly
- **Governance Notes:** Unit economics metric measuring growth efficiency and onboarding capital allocation.

---

### 6. Net Revenue Retention (NRR)
- **Definition:** Recurring revenue retained from existing cohort customers over a 30-day window including expansions minus contractions/churn.
- **Formula:** 
  $$\text{NRR} = \frac{\text{Starting\_ARR} + \text{Expansions} - \text{Contractions} - \text{Churn}}{\text{Starting\_ARR}}$$
- **Data Source:** Subscription ledgers table (`recurring_amount`, `cohort_id`)
- **Target Range:** 105.0% – 125.0%
- **Owner:** Chief Revenue Officer
- **Frequency:** Monthly
- **Governance Notes:** Measures account expansion velocity without relying on net-new acquisition.
