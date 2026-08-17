"""
Hierarchical KPI Decomposition Module
====================================
Implements 3-Tier Hierarchical Decomposition for Top-Level Monthly Revenue:
- Level 1 (Top-Level): Total Monthly Revenue ($)
- Level 2 (Customer Segment Breakout): Revenue grouped by customer tier (Enterprise, SMB, Startup)
- Level 3 (Product Category Breakout): Detailed product/service lines nested within each segment.

Includes mathematical reconciliation asserting Level 3 components sum exactly to Level 2 subtotals,
which sum identically to Level 1 total.
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

DEFAULT_DECOMPOSITION_DATA = {
    "Enterprise": {
        "Freight Forwarding": 350000.00,
        "Warehousing & Storage": 250000.00,
        "Customs Brokerage": 150000.00
    },
    "SMB": {
        "Last-Mile Delivery": 180000.00,
        "Warehousing & Storage": 100000.00,
        "Express Air Freight": 70000.00
    },
    "Startup": {
        "Last-Mile Delivery": 90000.00,
        "Express Air Freight": 40000.00,
        "Freight Forwarding": 20000.00
    }
}


def perform_hierarchical_decomposition(data: dict = None) -> dict:
    """
    Decomposes top-level revenue across 3-tier hierarchy and reconciles mathematical totals.
    """
    if data is None:
        data = DEFAULT_DECOMPOSITION_DATA

    level_2_segments = {}
    level_1_total = 0.0

    level_3_reconciled = True
    
    for segment, categories in data.items():
        cat_sum = sum(categories.values())
        cat_sum_rounded = round(cat_sum, 2)
        
        level_2_segments[segment] = {
            "subtotal": cat_sum_rounded,
            "formatted_subtotal": f"${cat_sum_rounded:,.2f}",
            "categories": {
                cat_name: {
                    "amount": round(amt, 2),
                    "formatted_amount": f"${round(amt, 2):,.2f}",
                    "pct_of_segment": round((amt / cat_sum_rounded) * 100, 1) if cat_sum_rounded > 0 else 0.0
                }
                for cat_name, amt in categories.items()
            }
        }
        
        # Mathematical check for Level 3 -> Level 2
        computed_l3_sum = sum(c["amount"] for c in level_2_segments[segment]["categories"].values())
        if abs(computed_l3_sum - cat_sum_rounded) > 1e-4:
            level_3_reconciled = False

        level_1_total += cat_sum_rounded

    level_1_total = round(level_1_total, 2)

    # Compute percent of total for Level 2
    for segment, seg_data in level_2_segments.items():
        seg_data["pct_of_total"] = round((seg_data["subtotal"] / level_1_total) * 100, 1) if level_1_total > 0 else 0.0

    # Mathematical check for Level 2 -> Level 1
    computed_l2_sum = sum(s["subtotal"] for s in level_2_segments.values())
    level_2_reconciled = abs(computed_l2_sum - level_1_total) < 1e-4

    is_exact_match = level_3_reconciled and level_2_reconciled

    payload = {
        "level_1": {
            "name": "Total Monthly Revenue",
            "total_amount": level_1_total,
            "formatted_total": f"${level_1_total:,.2f}"
        },
        "level_2_segments": level_2_segments,
        "reconciliation": {
            "level_3_to_level_2_match": level_3_reconciled,
            "level_2_to_level_1_match": level_2_reconciled,
            "status": "EXACT_MATCH" if is_exact_match else "DISCREPANCY",
            "discrepancy_amount": round(abs(computed_l2_sum - level_1_total), 4)
        }
    }

    return payload


def print_tree_breakdown(payload: dict):
    """Prints formatted ASCII hierarchy tree breakdown with encoding safety."""
    l1 = payload["level_1"]
    recon = payload["reconciliation"]

    print("=" * 80)
    print("         HIERARCHICAL KPI DECOMPOSITION & RECONCILIATION TREE          ")
    print("=" * 80)
    print(f"LEVEL 1 (Top-Level Total): {l1['name']} = {l1['formatted_total']}")
    print(f"Reconciliation Status  : [{recon['status']}] (L3->L2: {recon['level_3_to_level_2_match']}, L2->L1: {recon['level_2_to_level_1_match']})")
    print("-" * 80)

    segments = payload["level_2_segments"]
    seg_keys = list(segments.keys())

    for idx, seg_name in enumerate(seg_keys):
        seg = segments[seg_name]
        is_last_seg = (idx == len(seg_keys) - 1)
        seg_prefix = "+-- " if is_last_seg else "|-- "
        child_indent = "    " if is_last_seg else "|   "

        print(f"{seg_prefix}LEVEL 2 ({seg_name} Segment): {seg['formatted_subtotal']} ({seg['pct_of_total']}% of Total)")

        cat_items = list(seg["categories"].items())
        for c_idx, (cat_name, cat_info) in enumerate(cat_items):
            is_last_cat = (c_idx == len(cat_items) - 1)
            cat_prefix = child_indent + ("+-- " if is_last_cat else "|-- ")
            print(f"{cat_prefix}LEVEL 3 ({cat_name}): {cat_info['formatted_amount']} ({cat_info['pct_of_segment']}% of Segment)")

    print("=" * 80)


def main():
    payload = perform_hierarchical_decomposition()
    print_tree_breakdown(payload)

    output_path = os.path.join(SCRIPT_DIR, "kpi_decomposition_report.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"[+] Hierarchical Decomposition Payload exported cleanly to: {output_path}")


if __name__ == "__main__":
    main()
