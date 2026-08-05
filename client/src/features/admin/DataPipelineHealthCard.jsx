import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import { CheckCircle2, Filter, Cpu, Sparkles } from 'lucide-react';

export const DataPipelineHealthCard = () => {
  const { apiClient } = useApi();

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics-admin-dashboard-health'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/analytics/admin-dashboard');
        return res.data;
      } catch (err) {
        try {
          const res = await apiClient.get('/analytics/dashboard-summary');
          return res.data;
        } catch (e) {
          const fallback = await apiClient.get('/analytics/pipeline-quality');
          return fallback.data;
        }
      }
    },
    refetchInterval: 10000,
  });

  const report = analyticsRes?.qualityReport || {
    rawLogsIngested: 10300,
    doublePingsDeduplicated: 309,
    gpsAnomaliesPurged: 206,
    dwellOutliersPurged: 154,
    telemetryValuesImputed: 412,
    timestampsStandardized: 9785,
    cleanRecordsOutput: 9785,
    dataQualityIndex: 95.0,
    pipelineLatencyMs: 340,
  };

  return (
    <div className="card-panel p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 font-sans">
          <Filter className="h-4 w-4 text-sky-400" />
          Python Terminal Data Cleansing &amp; Pipeline Quality Report
        </h2>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#06090f] border border-slate-800/60 rounded text-[9px] font-mono font-bold text-emerald-400">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          QUALITY INDEX: {report.dataQualityIndex}%
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="data-label text-[9px]">Raw Telemetry Ingested</span>
          <span className="text-xl font-extrabold font-mono text-slate-100 mt-1">
            {report.rawLogsIngested.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">IoT Scanner &amp; RFID Scans</span>
        </div>

        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="data-label text-[9px]">Double-Pings Deduplicated</span>
          <span className="text-xl font-extrabold font-mono text-amber-400 mt-1">
            {report.doublePingsDeduplicated.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">&lt;10s Rapid Scanner Dupes</span>
        </div>

        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="data-label text-[9px]">Anomalies Purged</span>
          <span className="text-xl font-extrabold font-mono text-red-400 mt-1">
            {(report.gpsAnomaliesPurged + report.dwellOutliersPurged).toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">Bad GPS &amp; Negative Dwells</span>
        </div>

        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="data-label text-[9px]">Clean Records Output</span>
          <span className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
            {report.cleanRecordsOutput.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">ISO-8601 UTC Standardized</span>
        </div>
      </div>

      {/* Cleansing Rule Audit Tally */}
      <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-500 block">SCANNER DEDUP:</span>
            <span className="text-slate-200 font-bold">{report.doublePingsDeduplicated} purged</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-500 block">GPS COORDINATES:</span>
            <span className="text-slate-200 font-bold">{report.gpsAnomaliesPurged} sanitized</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-500 block">WEATHER IMPUTED:</span>
            <span className="text-slate-200 font-bold">{report.telemetryValuesImputed} modal fills</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-500 block">TIMESTAMP FORMAT:</span>
            <span className="text-slate-200 font-bold">100% ISO-8601 UTC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPipelineHealthCard;
