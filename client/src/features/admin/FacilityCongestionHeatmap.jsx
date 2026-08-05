import React from 'react';
import { Building2, Activity, ShieldAlert, ArrowUpRight, Flame } from 'lucide-react';

export const FacilityCongestionHeatmap = ({ heatmaps = [] }) => {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/40',
          border: 'border-red-900/60',
          text: 'text-red-400',
          bar: 'bg-gradient-to-r from-red-600 to-rose-500',
          pulse: 'bg-red-500',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/40',
          border: 'border-amber-900/60',
          text: 'text-amber-400',
          bar: 'bg-gradient-to-r from-amber-600 to-yellow-500',
          pulse: 'bg-amber-500',
        };
      case 'MODERATE':
        return {
          bg: 'bg-sky-950/40',
          border: 'border-sky-900/60',
          text: 'text-sky-400',
          bar: 'bg-gradient-to-r from-sky-600 to-cyan-500',
          pulse: 'bg-sky-500',
        };
      default:
        return {
          bg: 'bg-slate-900',
          border: 'border-slate-800',
          text: 'text-emerald-400',
          bar: 'bg-gradient-to-r from-emerald-600 to-teal-500',
          pulse: 'bg-emerald-500',
        };
    }
  };

  return (
    <div className="card-panel p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 font-sans">
          <Flame className="h-4 w-4 text-amber-500" />
          Facility Congestion Heatmap &amp; Yard Saturation Analysis
        </h2>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#06090f] border border-slate-800/60 rounded text-[9px] font-mono font-bold text-slate-400">
          NODES ANALYZED: {heatmaps.length}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {heatmaps.map((node) => {
          const config = getSeverityBadge(node.severity);
          const dwellDevMin = (node.avgDwellDeviationSec / 60).toFixed(1);

          return (
            <div
              key={node.facilityId}
              className={`bg-[#06090f] border rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-slate-700 ${config.border}`}
            >
              {/* Header: Name & Severity */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/40 pb-2">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-200 truncate">{node.facilityName}</h3>
                  <span className="text-[9px] font-mono text-slate-500 block">{node.facilityId}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shrink-0 ${config.bg} ${config.border} ${config.text}`}>
                  {node.severity}
                </span>
              </div>

              {/* Middle Metrics */}
              <div className="grid grid-cols-2 gap-2 my-2 font-mono text-[10px]">
                <div>
                  <span className="data-label text-[8px]">Yard Queue / Cap</span>
                  <p className="text-slate-100 font-bold text-xs mt-0.5">
                    {node.yardQueueCount} / {node.yardMaxCapacity} units
                  </p>
                </div>
                <div>
                  <span className="data-label text-[8px]">Cascade Risk</span>
                  <p className={`font-bold text-xs mt-0.5 ${config.text}`}>
                    {node.maxCascadeRiskScore}%
                  </p>
                </div>
                <div>
                  <span className="data-label text-[8px]">Dwell Deviation</span>
                  <p className={`font-bold text-[11px] mt-0.5 ${Number(dwellDevMin) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {Number(dwellDevMin) > 0 ? `+${dwellDevMin}` : dwellDevMin} m
                  </p>
                </div>
                <div>
                  <span className="data-label text-[8px]">Active Shipments</span>
                  <p className="text-slate-300 font-bold text-[11px] mt-0.5">
                    {node.activeShipmentCount} batches
                  </p>
                </div>
              </div>

              {/* Capacity Progress Heat Bar */}
              <div className="mt-1">
                <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                  <span className="text-slate-500">Utilization</span>
                  <span className={`font-extrabold ${config.text}`}>{node.capacityUtilization}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                    style={{ width: `${Math.min(100, Math.max(5, node.capacityUtilization))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacilityCongestionHeatmap;
