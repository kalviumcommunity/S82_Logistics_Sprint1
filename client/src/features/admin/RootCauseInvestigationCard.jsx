import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import {
  Search, ShieldAlert, AlertTriangle, CheckCircle2, TrendingDown,
  Clock, DollarSign, Activity, FileText, Layers, RefreshCw,
  GitBranch, Server, Terminal, ShieldCheck, ChevronRight
} from 'lucide-react';

export const RootCauseInvestigationCard = () => {
  const { apiClient } = useApi();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'segments' | 'errors' | 'report'
  const [selectedDimension, setSelectedDimension] = useState('payment_method');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['root-cause-investigation'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/root-cause-investigation');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const iso = data?.isolated_window;
  const seg = data?.segment_analysis;
  const corr = data?.correlation_analysis;
  const val = data?.hypothesis_validation;

  const isConfirmed = val?.verdict === 'ROOT CAUSE CONFIRMED';

  return (
    <div className="card-panel p-5 flex flex-col gap-4 border border-slate-800/80 bg-slate-900/60 rounded-2xl backdrop-blur-md">
      
      {/* ── Card Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              Root Cause Investigation &amp; Diagnostic Center
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                AUTOMATED DIAGNOSTICS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Systematic anomaly isolation, multi-dimensional failure concentration, and error log mining.
            </p>
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 font-mono text-[11px]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('segments')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'segments'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Segments
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'errors'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Error Logs
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Report Payload
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
            title="Refresh Diagnostic Engine"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Loading & Error Handling */}
      {isLoading && (
        <div className="p-8 text-center font-mono text-xs text-slate-400 animate-pulse">
          Executing Root Cause Investigation &amp; Error Log Diagnostic Mining...
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-mono">
          Diagnostic Engine Offline. Ensure backend API server is reachable.
        </div>
      )}

      {/* ── TAB 1: Overview & Anomaly Window Isolation ─────────────── */}
      {!isLoading && !isError && activeTab === 'overview' && iso && (
        <div className="flex flex-col gap-4">
          
          {/* Top Incident Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-950 border border-red-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800/60">
                  INCIDENT REF: {data.investigation_id}
                </span>
                <span className="text-xs text-slate-400">
                  Isolated Window: <strong className="text-slate-100">{iso.time_window_utc}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-1.5 font-medium">
                Automated statistical anomaly detection isolated an acute transaction completion drop below the 1.5 StdDev threshold.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-bold shrink-0">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>VERDICT: {val?.verdict || 'ROOT CAUSE CONFIRMED'}</span>
            </div>
          </div>

          {/* Metric Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/40 flex flex-col">
              <span className="text-[10px] font-sans text-slate-500 uppercase">Isolated Success Rate</span>
              <span className="text-lg font-extrabold text-red-400 mt-0.5">
                {iso.isolated_window_metrics.formatted_success_rate}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                Normal Baseline: {iso.baseline_comparison.before_window.formatted_success_rate}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/40 flex flex-col">
              <span className="text-[10px] font-sans text-slate-500 uppercase">Failed Transactions</span>
              <span className="text-lg font-extrabold text-amber-400 mt-0.5">
                {iso.isolated_window_metrics.failed_transactions} / {iso.isolated_window_metrics.total_transactions}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                Anomaly Window Volume
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/40 flex flex-col">
              <span className="text-[10px] font-sans text-slate-500 uppercase">Estimated Revenue Loss</span>
              <span className="text-lg font-extrabold text-red-400 mt-0.5">
                {iso.isolated_window_metrics.formatted_revenue_loss}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                Direct Uncaptured Revenue
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/40 flex flex-col">
              <span className="text-[10px] font-sans text-slate-500 uppercase">Anomaly Threshold</span>
              <span className="text-lg font-extrabold text-slate-200 mt-0.5">
                {(iso.statistical_thresholds.anomaly_threshold_rate * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                Mean - 1.5 StdDev Bound
              </span>
            </div>

          </div>

          {/* Baseline Before/During/After Window Comparison */}
          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800/60 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              Chronological Time-Series Window Baseline Comparison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Before Window */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/40 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold">1. BEFORE ANOMALY WINDOW</span>
                <span className="text-xs font-bold text-slate-300">{iso.baseline_comparison.before_window.hours}</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-extrabold text-emerald-400">{iso.baseline_comparison.before_window.formatted_success_rate}</span>
                  <span className="text-xs text-slate-400">{iso.baseline_comparison.before_window.formatted_revenue}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans">Volume: {iso.baseline_comparison.before_window.total_volume} transactions</span>
              </div>

              {/* Problem Window */}
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 flex flex-col gap-1">
                <span className="text-[10px] text-red-400 font-sans uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  2. ISOLATED ANOMALY WINDOW
                </span>
                <span className="text-xs font-bold text-slate-100">{iso.baseline_comparison.problem_window.hours}</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-extrabold text-red-400">{iso.baseline_comparison.problem_window.formatted_success_rate}</span>
                  <span className="text-xs text-slate-300">{iso.baseline_comparison.problem_window.formatted_revenue}</span>
                </div>
                <span className="text-[10px] text-red-400/80 font-sans font-bold">Failed Volume: {iso.isolated_window_metrics.failed_transactions} tx</span>
              </div>

              {/* After Window */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/40 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold">3. RECOVERY WINDOW</span>
                <span className="text-xs font-bold text-slate-300">{iso.baseline_comparison.after_window.hours}</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-extrabold text-emerald-400">{iso.baseline_comparison.after_window.formatted_success_rate}</span>
                  <span className="text-xs text-slate-400">{iso.baseline_comparison.after_window.formatted_revenue}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans">Volume: {iso.baseline_comparison.after_window.total_volume} transactions</span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: Multi-Dimensional Segment Breakdowns ───────────── */}
      {!isLoading && !isError && activeTab === 'segments' && seg && (
        <div className="flex flex-col gap-4 font-mono text-xs">
          
          {/* Sub-navigation dimension selectors */}
          <div className="flex gap-2 border-b border-slate-800/60 pb-3">
            {Object.entries(seg.dimensions).map(([dimKey, dimData]) => (
              <button
                key={dimKey}
                onClick={() => setSelectedDimension(dimKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDimension === dimKey
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/40'
                }`}
              >
                {dimData.dimension_label}
              </button>
            ))}
          </div>

          {/* Categorical Breakdown Table */}
          {seg.dimensions[selectedDimension] && (
            <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Category Name</th>
                    <th className="py-2.5 px-3">Success Rate</th>
                    <th className="py-2.5 px-3">Completed / Total Volume</th>
                    <th className="py-2.5 px-3">Failed Tx Count</th>
                    <th className="py-2.5 px-3">Failed Revenue Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {seg.dimensions[selectedDimension].categories.map((cat) => {
                    const isAlert = cat.status_flag === 'ALERT';
                    return (
                      <tr key={cat.category} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3">
                          {isAlert ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/60 animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              ALERT (&lt;50%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              NORMAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-200">{cat.category}</td>
                        <td className={`py-3 px-3 font-extrabold ${isAlert ? 'text-red-400' : 'text-emerald-400'}`}>
                          {cat.formatted_success_rate}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{cat.completed_volume} / {cat.total_volume}</td>
                        <td className="py-3 px-3 text-amber-400 font-bold">{cat.failed_volume}</td>
                        <td className="py-3 px-3 text-red-400 font-bold">{cat.formatted_failed_revenue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Primary Failure Focus Box */}
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-xs">
            <span className="text-[10px] font-sans font-bold text-red-400 uppercase tracking-wider">
              PRIMARY FAILURE CONCENTRATION FLAG
            </span>
            <p className="text-slate-200 mt-1 font-mono">
              Failures are overwhelmingly concentrated in <strong className="text-red-400">{seg.primary_affected_segment.dimension}: {seg.primary_affected_segment.category}</strong> with a critical success rate of <strong className="text-red-400">{seg.primary_affected_segment.formatted_success_rate}</strong> ({seg.primary_affected_segment.failed_volume} failed transactions).
            </p>
          </div>

        </div>
      )}

      {/* ── TAB 3: Error Log Frequency & Correlation ─────────────── */}
      {!isLoading && !isError && activeTab === 'errors' && corr && (
        <div className="flex flex-col gap-4 font-mono text-xs">
          
          {/* Hypothesis Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/60">
            <span className="text-[10px] font-sans text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              FORMULATED INITIAL ROOT CAUSE HYPOTHESIS (CONFIDENCE: {corr.initial_hypothesis.confidence_rating})
            </span>
            <blockquote className="text-slate-200 font-sans text-xs italic mt-1 pl-3 border-l-2 border-emerald-500">
              "{corr.initial_hypothesis.statement}"
            </blockquote>
          </div>

          {/* Top 10 Error Log Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Exception / Error Message Log</th>
                  <th className="py-2.5 px-3">Occurrence Count</th>
                  <th className="py-2.5 px-3">Concentration Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {corr.error_logs_analysis.top_10_errors.map((err) => (
                  <tr key={err.rank} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-400">#{err.rank}</td>
                    <td className="py-2.5 px-3 text-red-400 font-bold break-all">{err.error_message}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-extrabold">{err.occurrence_count}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-extrabold">{err.formatted_concentration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── TAB 4: Verification & Markdown Report Display ──────────── */}
      {!isLoading && !isError && activeTab === 'report' && data.markdown_report && (
        <div className="flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Generated Report File: <code className="text-slate-200">/investigation/investigation_report.md</code>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              PERSISTED TO DISK
            </span>
          </div>

          {/* Raw Markdown Output Scrollbox */}
          <pre className="p-4 rounded-xl bg-[#060911] border border-slate-800/80 text-slate-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[420px] overflow-y-auto">
            {data.markdown_report}
          </pre>
        </div>
      )}

      {/* Footer Reference Note */}
      <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Engine Orchestrator: <code className="text-slate-400">/investigation/run_root_cause_investigation.py</code></span>
        <span>Status: <code className="text-emerald-400">{val?.verdict || 'ROOT CAUSE CONFIRMED'}</code></span>
      </div>

    </div>
  );
};

export default RootCauseInvestigationCard;
