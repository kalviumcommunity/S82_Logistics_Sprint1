import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import { TrendingUp, ShieldAlert, DollarSign, AlertCircle, Building2, ChevronRight } from 'lucide-react';

export const CascadingKpiCard = () => {
  const { apiClient } = useApi();

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics-network-kpis'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/pipeline-quality');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const metrics = analyticsRes?.networkMetrics || {
    networkCascadePropagationIndex: 42.8,
    topBottleneckWarehouses: [
      { id: 'HUB-CHICAGO', name: 'Chicago Central Hub', congestionPercent: 80.0, queueCount: 12, capacity: 15, severity: 'CRITICAL' },
      { id: 'HUB-DETROIT', name: 'Detroit Depot', congestionPercent: 73.3, queueCount: 11, capacity: 15, severity: 'HIGH' },
      { id: 'HUB-[#0d1321]', name: 'Houston South Yard', congestionPercent: 66.7, queueCount: 10, capacity: 15, severity: 'MODERATE' },
    ],
    avertedSlaFinancialPenaltiesUsd: 42850,
    totalIngestedTelemetryLogs: 14820,
    activeMonitoredRoutes: 28,
  };

  return (
    <div className="card-panel p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 font-sans">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Network Cascade Propagation &amp; Operations Research KPIs
        </h2>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#06090f] border border-slate-800/60 rounded text-[9px] font-mono font-bold text-sky-400">
          MONITORED ROUTES: {metrics.activeMonitoredRoutes}
        </div>
      </div>

      {/* Grid of Key Problem Statement KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Cascade Propagation Index */}
        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between stat-accent-risk">
          <span className="data-label text-[9px]">Downstream Cascade Risk Index</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">
              {metrics.networkCascadePropagationIndex}%
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-1">
              Propagation probability across hub nodes
            </span>
          </div>
        </div>

        {/* KPI 2: Averted Financial SLA Penalties */}
        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between stat-accent-safe">
          <span className="data-label text-[9px]">Averted SLA Financial Penalties</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              +${metrics.avertedSlaFinancialPenaltiesUsd.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-1">
              Prescriptive What-If savings (MTD)
            </span>
          </div>
        </div>

        {/* KPI 3: Monitored Capacity Saturation */}
        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between stat-accent-neutral">
          <span className="data-label text-[9px]">Network Yard Saturation</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">
              73.4%
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-1">
              Mean yard queue utilization
            </span>
          </div>
        </div>
      </div>

      {/* Top Bottleneck Warehouses Table */}
      <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-amber-400" />
          Primary Bottleneck Logistics Nodes
        </span>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-500 text-[9px] uppercase tracking-wider">
                <th className="py-1.5 px-2">Warehouse Node</th>
                <th className="py-1.5 px-2">Queue / Capacity</th>
                <th className="py-1.5 px-2 text-right">Yard Saturation</th>
                <th className="py-1.5 px-2 text-right">Severity Level</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topBottleneckWarehouses.map((wh) => (
                <tr key={wh.id} className="border-b border-slate-800/30 hover:bg-slate-900/40">
                  <td className="py-2 px-2 text-slate-200 font-bold">{wh.name}</td>
                  <td className="py-2 px-2 text-slate-400">{wh.queueCount} / {wh.capacity} units</td>
                  <td className="py-2 px-2 text-right text-amber-400 font-extrabold">{wh.congestionPercent}%</td>
                  <td className="py-2 px-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      wh.severity === 'CRITICAL' ? 'bg-red-950/40 border border-red-900/40 text-red-400' :
                      wh.severity === 'HIGH'     ? 'bg-amber-950/40 border border-amber-900/40 text-amber-400' :
                                                   'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}>
                      {wh.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CascadingKpiCard;
