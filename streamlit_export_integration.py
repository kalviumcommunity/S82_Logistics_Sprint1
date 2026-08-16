import streamlit as st
import pandas as pd
import plotly.express as px
from export_functions import export_analysis
import os

st.set_page_config(layout='wide')
st.title('Sales Analysis Dashboard')

# Mock analysis logic
def run_analysis():
    df = pd.DataFrame({
        'customer_id': range(1, 101), 
        'segment': ['Enterprise', 'SMB'] * 50, 
        'churn_risk': [0.1, 0.5] * 50,
        'support_interactions': [5, 2] * 50,
        'response_time_hours': [1, 24] * 50
    })
    return df

# Main dashboard layout
st.write("## Current Data")
df = run_analysis()
st.dataframe(df.head())

fig_revenue = px.bar(x=['Jan', 'Feb'], y=[10, 20], title="Revenue Trend")
fig_churn = px.pie(names=['Retained', 'Churned'], values=[80, 20], title="Churn by Segment")

col1, col2 = st.columns(2)
col1.plotly_chart(fig_revenue)
col2.plotly_chart(fig_churn)

# Add export section
st.sidebar.header('Export')
if st.sidebar.button('📥 Export Analysis'):
    with st.spinner('Generating exports in CSV, PDF, and HTML...'):
        summary = """## Analysis Report
### Key Findings
- Support speed impacts retention significantly.
- Customers receiving support within 2 hours churn at 3%, compared to 12% for those waiting over 24 hours.
### Recommendations
- Hire 2 support engineers to improve response times.
- Implement Response Time SLA tracking.
        """
        charts = {'Revenue Trend': fig_revenue, 'Churn by Segment': fig_churn}
        
        # Call the reusable export function
        output_dir = 'output'
        os.makedirs(output_dir, exist_ok=True)
        report_dir = export_analysis(df, summary, charts, output_dir)
        
        st.success(f'✓ Analysis successfully exported to: {report_dir}')
        
        # Provide download links for stakeholders
        
        # CSV download
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label='📊 Download Data (CSV)',
            data=csv_bytes,
            file_name='cleaned_data.csv',
            mime='text/csv'
        )
        
        # HTML download
        try:
            html_path = f'{report_dir}/interactive_report.html'
            if os.path.exists(html_path):
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_bytes = f.read()
                st.download_button(
                    label='🌐 Download Report (HTML)',
                    data=html_bytes,
                    file_name='interactive_report.html',
                    mime='text/html'
                )
        except Exception as e:
            st.error(f"Could not load HTML report for download: {e}")
