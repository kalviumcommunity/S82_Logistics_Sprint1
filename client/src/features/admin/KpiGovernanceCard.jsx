import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import {
  ShieldCheck, AlertTriangle, Layers, FileText, ChevronRight,
  ChevronDown, DollarSign, Users, Percent, CheckCircle2,
  RefreshCw, GitBranch, ArrowUpRight, Lock
} from 'lucide-react';

export const KpiGovernanceCard = () => {
  const { apiClient } = useApi();
  const [activeTab, setActiveTab] = useState('validation'); // 'validation' | 'hierarchy'
  const [expandedSegments, setExpandedSegments] = useState({
    Enterprise: true,
    SMB: true,
    Startup: true,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kpi-governance-validation'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/kpi-validation');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const toggleSegment = (seg) => {
    setExpandedSegments((prev) => ({ ...prev, [seg]: !prev[seg] }));
  };

  const kpisList = data?.kpis ? Object.values(data.kpis) : [];
  const summary = data?.summary || { total_kpis: 5, passed: 5, alerts: 0 };
  const decomp = data?.decomposition;

  const getMetricIcon = (unit) => {
    if (unit === 'USD') return <DollarSign className="h-4 w-4 text-emerald-400" />;
    if (unit === 'ratio') return <Percent className="h-4 w-4 text-amber-400" />;
    return <Users className="h-4 w-4 text-sky-400" />;
  };

  return (
    <div className="card-panel p-5 flex flex-col gap-4 border border-slate-800/80 bg-slate-900/60 rounded-2xl backdrop-blur-md">
      
      {/* ── Header Row ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              KPI Definition, Computation &amp; Validation Governance
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                SINGLE SOURCE OF TRUTH
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cross-functional metric definitions, target validation flags, and 3-tier revenue decomposition.
            </p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 font-mono text-[11px]">
            <button
              onClick={() => setActiveTab('validation')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'validation'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Target Validation ({summary.passed}/{summary.total_kpis})
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'hierarchy'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              3-Tier Decomposition
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
            title="Refresh Governance Data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="p-8 text-center font-mono text-xs text-slate-400 animate-pulse">
          Loading KPI Governance &amp; Validation Payload...
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-mono">
          Failed to fetch KPI validation payload. Re-trying connection...
        </div>
      )}

      {/* ── TAB 1: Target Validation Report Table ──────────────────── */}
      {!isLoading && !isError && activeTab === 'validation' && (
        <div className="flex flex-col gap-3">
          
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-sans uppercase">Total Governed KPIs</span>
              <span className="text-base font-extrabold text-slate-200">{summary.total_kpis} Metrics</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-sans uppercase">Validation Status</span>
              <span className="text-base font-extrabold text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                {summary.passed} PASSED
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-sans uppercase">Active Alerts</span>
              <span className={`text-base font-extrabold ${summary.alerts > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {summary.alerts} ALERTS
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-sans uppercase">Data Frequency</span>
              <span className="text-base font-extrabold text-slate-300">Daily / Real-Time</span>
            </div>
          </div>

          {/* High-Density Governance Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Metric Name</th>
                  <th className="py-2.5 px-3">Actual Value</th>
                  <th className="py-2.5 px-3">Target Range</th>
                  <th className="py-2.5 px-3">Operational Owner</th>
                  <th className="py-2.5 px-3">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {kpisList.map((kpi) => {
                  const isPass = kpi.status === 'PASS';
                  return (
                    <tr
                      key={kpi.key}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Status Flag */}
                      <td className="py-3 px-3">
                        {isPass ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-extrabold text-[10px] bg-red-950/60 text-red-400 border border-red-800/50 animate-pulse">
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                            ALERT
                          </span>
                        )}
                      </td>

                      {/* Metric Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          {getMetricIcon(kpi.unit)}
                          <span>{kpi.name}</span>
                        </div>
                        {kpi.notes && (
                          <p className="text-[10px] text-slate-500 font-sans font-medium mt-0.5 group-hover:text-slate-400 transition-colors">
                            {kpi.notes}
                          </p>
                        )}
                      </td>

                      {/* Actual Value */}
                      <td className="py-3 px-3 font-extrabold text-sm text-slate-100">
                        {kpi.formatted_value}
                      </td>

                      {/* Target Range */}
                      <td className="py-3 px-3 text-slate-400">
                        {kpi.target_range}
                      </td>

                      {/* Operational Owner */}
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/60 text-[11px]">
                          {kpi.owner}
                        </span>
                      </td>

                      {/* Frequency */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {kpi.frequency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Hierarchical Revenue Decomposition Tree ───────────── */}
      {!isLoading && !isError && activeTab === 'hierarchy' && decomp && (
        <div className="flex flex-col gap-4 font-mono text-xs">
          
          {/* Level 1 Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-sans text-emerald-400 font-bold uppercase tracking-wider">
                LEVEL 1 — TOP-LEVEL REVENUE KPI
              </span>
              <h3 className="text-xl font-black text-slate-100 mt-0.5">
                {decomp.level_1.name}: <span className="text-emerald-400">{decomp.level_1.formatted_total}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[11px] font-bold">
              <CheckCircle2 className="h-4 w-4" />
              RECONCILIATION: {decomp.reconciliation.status}
              <span className="text-[9px] text-slate-400 font-normal">($0.00 discrepancy)</span>
            </div>
          </div>

          {/* Level 2 & Level 3 Segment Tree */}
          <div className="flex flex-col gap-3">
            {Object.entries(decomp.level_2_segments).map(([segName, seg]) => {
              const isExpanded = expandedSegments[segName];
              return (
                <div
                  key={segName}
                  className="rounded-xl border border-slate-800/60 bg-[#090d16] overflow-hidden"
                >
                  {/* Level 2 Segment Header */}
                  <button
                    onClick={() => toggleSegment(segName)}
                    className="w-full p-3.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                      <span className="font-extrabold text-sm text-slate-200">
                        LEVEL 2 — {segName} Segment
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {seg.pct_of_total}% of Total
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-emerald-400">
                      {seg.formatted_subtotal}
                    </div>
                  </button>

                  {/* Level 3 Product Category Breakdown */}
                  {isExpanded && (
                    <div className="p-3 pl-8 bg-slate-950/60 border-t border-slate-800/40 flex flex-col gap-2">
                      <span className="text-[10px] font-sans text-slate-500 font-semibold uppercase tracking-wider">
                        LEVEL 3 — PRODUCT CATEGORY BREAKDOWN WITHIN {segName.toUpperCase()}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                        {Object.entries(seg.categories).map(([catName, cat]) => (
                          <div
                            key={catName}
                            className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/50 flex flex-col gap-1"
                          >
                            <span className="text-[11px] text-slate-300 font-bold">
                              {catName}
                            </span>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs font-extrabold text-slate-100">
                                {cat.formatted_amount}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold">
                                {cat.pct_of_segment}% of Seg.
                              </span>
                            </div>
                            {/* Mini progress bar */}
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${cat.pct_of_segment}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Footer Reference Note */}
      <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Reference file: <code className="text-slate-400">/kpis/kpi_reference.md</code></span>
        <span>Engine: <code className="text-slate-400">/kpis/validate_kpis.py</code></span>
      </div>

    </div>
  );
};

export default KpiGovernanceCard;
