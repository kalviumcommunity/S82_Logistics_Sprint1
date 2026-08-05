# Standardized KPI Definition & Governance Framework

This document establishes the single source of truth for key performance indicators (KPIs) across Finance, Product, Sales, and Operations. All reporting engines, analytics dashboards, and data models must adhere to these standardized definitions, target ranges, formulas, and data governance ownership.

---

## Executive Summary Matrix

| Metric Name | Operational Owner | Frequency | Target Range | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Active Users (MAU)** | Product Manager | Daily | 5,000 – 6,000 | `transactions` table |
| **Average Revenue Per Customer (ARPC)** | Finance Lead | Weekly | $90.00 – $110.00 | `transactions` table |
| **Monthly Churn Rate** | Customer Success Lead | Monthly | 0.0% – 5.0% | `transactions` table |
| **Payment Success Rate (PSR)** | Payment Infrastructure Lead | Real-Time / Hourly | 95.0% – 100.0% | `transactions` table |
| **Customer Acquisition Cost (CAC)** | Growth Marketing Lead | Monthly | $0.00 – $50.00 | `acquisition_costs` & `transactions` tables |
| **Net Revenue Retention (NRR)** | Chief Revenue Officer | Monthly | 105.0% – 125.0% | `subscription_ledgers` table |

---

## Core KPI Specification Reference

### 1. Monthly Active Users (MAU)
- **Definition:** Distinct customers with at least one completed transaction in the last 30 days.
- **Formula:** 
  $$\text{MAU} = \text{COUNT}(\text{DISTINCT } \text{customer\_id}) \quad \text{WHERE } \text{status} = \text{'completed'} \text{ AND } \text{transaction\_date} \ge \text{TODAY}() - 30\text{ days}$$
- **Data Source:** `transactions` table (`customer_id`, `transaction_date`, `status`)
- **Target Range:** 5,000 – 6,000
- **Owner:** Product Manager
- **Frequency:** Daily
- **Governance Notes:** Primary indicator of active platform engagement. Excludes unverified user leads or non-completed transactions.

---

### 2. Average Revenue Per Customer (ARPC)
- **Definition:** Total completed transaction revenue divided by distinct active customers.
- **Formula:** 
  $$\text{ARPC} = \frac{\sum \text{amount}}{\text{COUNT}(\text{DISTINCT } \text{customer\_id})} \quad \text{WHERE } \text{status} = \text{'completed'}$$
- **Data Source:** `transactions` table (`amount`, `customer_id`, `status`)
- **Target Range:** $90.00 – $110.00
- **Owner:** Finance Lead
- **Frequency:** Weekly
- **Governance Notes:** Measures monetization depth per acquired customer account across completed payment events.

---

### 3. Monthly Churn Rate
- **Definition:** Percentage of active customers in Period 1 (days -60 to -30) with zero activity in Period 2 (last 30 days).
- **Formula:** 
  $$\text{Churn Rate} = \frac{\text{Active}_{P1} - \text{Active}_{P2 \mid P1}}{\text{Active}_{P1}}$$
- **Data Source:** `transactions` table (`customer_id`, `transaction_date`)
- **Target Range:** 0.0% – 5.0%
- **Owner:** Customer Success Lead
- **Frequency:** Monthly
- **Governance Notes:** Signals account attrition and retention risk. Measures loss of active customer base over sequential 30-day windows.

---

### 4. Payment Success Rate (PSR)
- **Definition:** Proportion of successful checkout transactions over total attempted payment transactions.
- **Formula:** 
  $$\text{PSR} = \frac{\text{COUNT}(\text{transaction\_id} \text{ WHERE } \text{status} = \text{'completed'})}{\text{COUNT}(\text{transaction\_id})}$$
- **Data Source:** `transactions` table (`transaction_id`, `status`)
- **Target Range:** 95.0% – 100.0%
- **Owner:** Payment Infrastructure Lead
- **Frequency:** Real-Time / Hourly
- **Governance Notes:** Technical health indicator measuring gateway authorization efficiency and payment processing friction.

---

### 5. Customer Acquisition Cost (CAC)
- **Definition:** Total fully burdened marketing and sales spend divided by new paying customer additions.
- **Formula:** 
  $$\text{CAC} = \frac{\sum \text{marketing\_and\_sales\_spend}}{\text{COUNT}(\text{DISTINCT } \text{new\_paying\_customers})}$$
- **Data Source:** `acquisition_costs` table (`spend`) & `transactions` table (`customer_id`, `first_purchase_date`)
- **Target Range:** $0.00 – $50.00
- **Owner:** Growth Marketing Lead
- **Frequency:** Monthly
- **Governance Notes:** Unit economics metric tracking customer onboarding efficiency and marketing capital efficiency.

---

### 6. Net Revenue Retention (NRR)
- **Definition:** Recurring revenue retained from existing cohort customers over a 30-day window including expansions minus contractions/churn.
- **Formula:** 
  $$\text{NRR} = \frac{\text{Starting\_ARR} + \text{Expansions} - \text{Contractions} - \text{Churn}}{\text{Starting\_ARR}}$$
- **Data Source:** `subscription_ledgers` table (`recurring_amount`, `cohort_id`)
- **Target Range:** 105.0% – 125.0%
- **Owner:** Chief Revenue Officer
- **Frequency:** Monthly
- **Governance Notes:** Measures account expansion velocity without relying on net-new acquisition.
