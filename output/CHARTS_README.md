# Logistics Delay Analysis Visualizations

## Overview
This folder contains five specific visualization types demonstrating the application of business visualization principles. All charts follow a consistent color palette tailored for our logistics operations, where Green signifies on-time success and Red explicitly flags delays.

## Chart 1: Delays by Route (chart1_delays_by_route.png)
- **Type:** Horizontal bar chart
- **Question:** Which operational route experiences the most delays?
- **Key Insight:** Route A is heavily bottlenecked, with significantly more delays than the rest.
- **Annotation:** Highlighted Route A as the highest bottleneck requiring operational intervention.

## Chart 2: Delay Trend (chart2_delay_trend.png)
- **Type:** Line chart with multiple series
- **Question:** How have delay volumes changed over the last 12 months for top routes?
- **Key Insight:** Route A saw a massive spike in delays over the summer.
- **Annotation:** Annotated the severe spike in month 7, indicating a weather disruption. Included a green horizontal threshold line indicating the acceptable delay count.

## Chart 3: Delay Distribution (chart3_delay_distribution.png)
- **Type:** Histogram with bins
- **Question:** What is the typical duration of a shipment delay?
- **Key Insight:** Most delays are under 60 minutes, but a long tail extends past 120 minutes.
- **Annotation:** A red vertical threshold marks critical cascading delay risk (>120 mins). An annotation highlights the long tail indicating extreme outliers.

## Chart 4: Shipment Composition (chart4_shipment_composition.png)
- **Type:** Stacked bar chart by quarter
- **Question:** How does the proportion of delayed shipments compare to overall volume per quarter?
- **Key Insight:** While Q3 didn't have the highest volume, it had the highest proportion of delayed shipments.
- **Annotation:** Data labels display the exact delayed count. An annotation points to Q3, marking a specific supply chain disruption that inflated the delay stack.

## Chart 5: Volume vs Delay (chart5_volume_vs_delay.png)
- **Type:** Scatter plot with trend line
- **Question:** Does higher warehouse transfer volume correlate with higher average delay times?
- **Key Insight:** Strong positive correlation (r=0.82) – as facility volume increases, delays scale linearly, proving that congestion directly causes cascading delays.
- **Annotation:** Highlighted a specific outlier day where system overload caused massive delays despite only moderately high volume.
