# Technical Appendix: Churn and Support Analysis

## Data Source and Validation
We analyzed 50,000 customers over a 24-month period using our CRM and support ticket databases. The dataset was cleaned to remove inactive accounts (zero logins over the 24-month period). Support interactions were mapped to subscription renewals using exact timestamps.

## Statistical Methodology
- **Correlation Analysis:** We measured the Pearson correlation coefficient between average first-response time and the binary renewal outcome. 
- **Cohort Analysis:** Customers were bucketed into response time cohorts (<2 hours, 2-4 hours, 4-24 hours, >24 hours) to isolate the impact of speed on retention.
- **Logistic Regression:** We built a logistic regression model with response time as the primary predictor and churn as the outcome variable.

## Model Validation and Assumptions
- The model achieved a 0.72 AUC score.
- The p-value for the response time coefficient was < 0.001, indicating statistical significance.
- **Assumption:** We assume that support speed is the primary driver of satisfaction for these tickets, though ticket resolution quality is a confounding variable that we did not fully control for in this iteration.

## Supporting Findings
- The correlation coefficient between response time and churn is -0.65.
- The logistic regression coefficient implies that for every hour of delay, churn risk increases by 2%.
- The variance explained (R²) by response time alone accounts for 40% of churn differences across our customer base.
