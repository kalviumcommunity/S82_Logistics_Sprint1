import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Ensure UTF-8 output handling for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

os.makedirs('output', exist_ok=True)

print("=" * 80)
print("LOGISTICS PLATFORM SHIPPER SIGNUP & ONBOARDING FUNNEL ANALYSIS")
print("Aligned with Problem Statement: Predicting Route Delays & Carrier/Shipper Conversion")
print("=" * 80)

# =========================================================================
# Task 1: Define Funnel Stages and Count Users
# =========================================================================
print("\n[TASK 1] Define Funnel Stages and Count Users")
print("-" * 70)

# Simulating shipper signup funnel dataframe based on specified stage counts
n_clicks = 10000

# Create deterministic sequential stage flags
np.random.seed(42)

# Generate dataframe matching exact stage counts:
# Stage 1: Click Sign Up = 10,000
# Stage 2: Email Entered = 8,000
# Stage 3: Password Created = 6,000
# Stage 4: Email Verified = 5,000
# Stage 5: Payment Added = 4,000
# Stage 6: First Purchase (First Shipment Booked) = 2,000

df = pd.DataFrame({
    'user_id': [f"SHIPPER-{i:05d}" for i in range(1, n_clicks + 1)],
    'signup_completed': 1,
    'email_entered': [1 if i < 8000 else 0 for i in range(n_clicks)],
    'password_created': [1 if i < 6000 else 0 for i in range(n_clicks)],
    'email_verified': [1 if i < 5000 else 0 for i in range(n_clicks)],
    'payment_added': [1 if i < 4000 else 0 for i in range(n_clicks)],
    'first_purchase': [1 if i < 2000 else 0 for i in range(n_clicks)]
})

# Count users at each stage
stage1_signup = len(df[df['signup_completed'] == 1])
stage2_email = len(df[df['email_entered'] == 1])
stage3_password = len(df[df['password_created'] == 1])
stage4_verified = len(df[df['email_verified'] == 1])
stage5_payment = len(df[df['payment_added'] == 1])
stage6_purchase = len(df[df['first_purchase'] == 1])

stages = {
    'Sign Up': stage1_signup,
    'Email Entered': stage2_email,
    'Password Created': stage3_password,
    'Email Verified': stage4_verified,
    'Payment Added': stage5_payment,
    'First Purchase': stage6_purchase
}

print("Funnel Stage User Volume:")
for stage_name, count in stages.items():
    print(f" - {stage_name}: {count:,} users")

# Overall conversion rate calculation
overall_conversion = (stage6_purchase / stage1_signup) * 100
print(f"\nOverall Funnel Conversion Rate: {overall_conversion:.1f}%")

# =========================================================================
# Task 2: Compute Drop-Off Rate Between Stages
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 2] Compute Drop-Off Rate Between Stages")
print("-" * 70)

stage_list = list(stages.values())
stage_names = list(stages.keys())

drop_off = []
for i in range(len(stage_list) - 1):
    users_before = stage_list[i]
    users_after = stage_list[i+1]
    users_lost = users_before - users_after
    drop_pct = (users_lost / users_before) * 100
    comp_pct = (users_after / users_before) * 100
    
    drop_off.append({
        'from_stage': stage_names[i],
        'to_stage': stage_names[i+1],
        'users_before': users_before,
        'users_after': users_after,
        'users_lost': users_lost,
        'completion_rate': f'{comp_pct:.1f}%',
        'drop_rate': f'{drop_pct:.1f}%',
        'raw_drop_pct': drop_pct,
        'raw_comp_pct': comp_pct
    })

funnel_df = pd.DataFrame(drop_off)
print("\nFunnel Step Progression Table:")
print(funnel_df[['from_stage', 'to_stage', 'users_before', 'users_after', 'users_lost', 'completion_rate', 'drop_rate']].to_string(index=False))

# Identify biggest drop by volume and rate
biggest_drop_idx = funnel_df['users_lost'].idxmax()
highest_drop_rate_idx = funnel_df['raw_drop_pct'].idxmax()

print(f"\nBiggest Drop by Volume: {funnel_df.loc[biggest_drop_idx, 'from_stage']} → {funnel_df.loc[biggest_drop_idx, 'to_stage']} ({funnel_df.loc[biggest_drop_idx, 'users_lost']:,} users lost)")
print(f"Highest Drop-Off Percentage: {funnel_df.loc[highest_drop_rate_idx, 'from_stage']} → {funnel_df.loc[highest_drop_rate_idx, 'to_stage']} ({funnel_df.loc[highest_drop_rate_idx, 'drop_rate']} drop rate)")

# =========================================================================
# Task 3: Visualize Funnel
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 3] Visualize Funnel")
print("-" * 70)

fig, ax = plt.subplots(figsize=(12, 6))

colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
bars = ax.bar(stages.keys(), stages.values(), color=colors, width=0.55, edgecolor='black', linewidth=0.8)

ax.set_ylabel('User Count', fontsize=12, fontweight='bold', labelpad=10)
ax.set_xlabel('Funnel Stage', fontsize=12, fontweight='bold', labelpad=10)
ax.set_title('Logistics Shipper Signup Funnel: User Volume & Stage Drop-Off', fontsize=14, fontweight='bold', pad=15)
ax.set_ylim(0, max(stages.values()) * 1.18)
ax.grid(axis='y', linestyle='--', alpha=0.5)

# Annotate counts and percentages above bars
total_initial = stage1_signup
for bar, (stage, count) in zip(bars, stages.items()):
    pct_of_total = (count / total_initial) * 100
    ax.text(
        bar.get_x() + bar.get_width() / 2,
        count + 180,
        f"{count:,}\n({pct_of_total:.0f}%)",
        ha='center',
        va='bottom',
        fontweight='bold',
        fontsize=10
    )

plt.xticks(rotation=15, ha='right', fontsize=11, fontweight='bold')
plt.tight_layout()

chart_path_root = 'funnel_chart.png'
chart_path_output = 'output/funnel_chart.png'

plt.savefig(chart_path_root, dpi=300)
plt.savefig(chart_path_output, dpi=300)
plt.close()

print(f"✓ Funnel visualization saved to: {chart_path_root}")
print(f"✓ Funnel visualization duplicate saved to: {chart_path_output}")

# =========================================================================
# Task 4: Calculate Business Impact of Each Drop-Off
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 4] Calculate Business Impact of Each Drop-Off")
print("-" * 70)

# Revenue value per customer completing initial setup & booking
revenue_per_customer = 100

impact_analysis = []
for idx, row in funnel_df.iterrows():
    users_lost = row['users_lost']
    revenue_lost = users_lost * revenue_per_customer
    drop_pct = row['raw_drop_pct']
    
    # Priority ranking based on revenue lost and drop rate intensity
    priority = 'CRITICAL' if (revenue_lost >= 200000 and drop_pct >= 40) else ('HIGH' if revenue_lost >= 150000 else 'MEDIUM')
    
    impact_analysis.append({
        'drop_point': f"{row['from_stage']} → {row['to_stage']}",
        'users_lost': users_lost,
        'drop_rate': row['drop_rate'],
        'completion_rate': row['completion_rate'],
        'raw_revenue': revenue_lost,
        'revenue_impact': f'${revenue_lost:,.0f}',
        'priority': priority
    })

impact_df = pd.DataFrame(impact_analysis)

# Sort by revenue impact & drop rate severity
sorted_impact_df = impact_df.sort_values(by=['raw_revenue', 'users_lost'], ascending=[False, False])
print("\nBusiness Impact Analysis (Sorted by Business Impact):")
print(sorted_impact_df[['drop_point', 'users_lost', 'drop_rate', 'completion_rate', 'revenue_impact', 'priority']].to_string(index=False))

total_revenue_lost = impact_df['raw_revenue'].sum()
print(f"\nTotal Revenue Lost Across All Funnel Leaks: ${total_revenue_lost:,.0f}")

highest_priority_row = sorted_impact_df.iloc[0]
print(f"Highest-Priority Bottleneck: {highest_priority_row['drop_point']} (${highest_priority_row['revenue_impact']} Lost | {highest_priority_row['drop_rate']} Drop Rate)")

# =========================================================================
# Task 5: Actionable Recommendation
# =========================================================================
print("\n" + "-" * 70)
print("[TASK 5] Actionable Recommendation")
print("-" * 70)

highest_impact = funnel_df.loc[funnel_df['raw_drop_pct'].idxmax()]
users_lost_highest = highest_impact['users_lost']
revenue_lost_highest = users_lost_highest * revenue_per_customer

recommendation = f"""
FUNNEL OPTIMIZATION PRIORITY & STRATEGY REPORT:

CRITICAL BOTTLENECK IDENTIFIED:
Stage: {highest_impact['from_stage']} → {highest_impact['to_stage']}
Users Lost: {users_lost_highest:,.0f} shippers
Drop Rate: {highest_impact['drop_rate']} (50.0% lost at final conversion step)
Revenue Impact: ${revenue_lost_highest:,.0f} lost potential value

ROOT CAUSE HYPOTHESES (Logistics Domain Friction):
1. Payment & Credit Term Friction: Shippers encounter unexpected payment processing holds, credit check delays, or lack of freight invoicing (BOL/POD billing) support during first order checkout.
2. Complex Route & Rate Booking UX: The initial shipment creation interface requires redundant route parameters, origin/destination zip validation, and manual parcel class selection without auto-suggestions.
3. Lack of Instant SLA & Route Transparency: Shippers hesitate at purchase because estimated delivery transit times and cascading route delay risks are not transparently displayed before payment confirmation.
4. Timing & Friction: Requiring upfront payment before allowing shippers to preview available carrier schedules and route reliability scores creates premature conversion friction.

RECOMMENDED ACTION PLAN:
1. Implement 1-Click Saved Payment & Freight Line Credit: Enable immediate freight credit terms and simplified digital wallet checkout to eliminate payment authorization delays.
2. Streamline First Purchase Checkout UX: Pre-fill origin warehouse data, automate route distance/cost estimations, and display clear delivery SLA badges.
3. Conduct A/B Testing: Test a streamlined 2-step shipment booking wizard vs. current multi-step layout.
4. Deployment & Monitoring: Roll out to 100% of user traffic once A/B test confirms a >5% drop-rate reduction.

EXPECTED BUSINESS IMPACT & SUCCESS CRITERIA:
- 10% Improvement Target: Recover 10% of lost shippers at the {highest_impact['from_stage']} → {highest_impact['to_stage']} bottleneck.
  • Additional Conversions: +{int(users_lost_highest * 0.1):,.0f} completed first purchases
  • Additional Revenue: +${int(users_lost_highest * 0.1 * revenue_per_customer):,.0f} recurring platform value
- Primary Success Metric: Increase 'Payment Added → First Purchase' stage completion rate from 50.0% to 60.0% within 30 days post-launch.
"""

print(recommendation)

# Export funnel metrics to CSV
csv_out = 'output/funnel_metrics.csv'
funnel_df.to_csv(csv_out, index=False)
print(f"✓ Saved funnel summary metrics to {csv_out}")
