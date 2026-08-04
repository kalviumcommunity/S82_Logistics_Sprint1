import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import {
  TrendingUp, DollarSign, Clock, ShieldCheck, Zap,
  AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, X, Sliders
} from 'lucide-react';

export const SimulationDrawer = ({ shipmentId, isOpen, onClose, onRerouteApplied }) => {
  const { apiClient } = useApi();
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [applySuccessMsg, setApplySuccessMsg] = useState(null);

  // Run What-If simulation query
  const { data: simData, isLoading, refetch } = useQuery({
    queryKey: ['what-if-simulation', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return null;
      const res = await apiClient.post('/simulations/run', {
        shipmentId,
        candidateRouteIds: ['ROUTE-ALT-01', 'ROUTE-ALT-02', 'ROUTE-ALT-03'],
      });
      return res.data;
    },
    enabled: Boolean(isOpen && shipmentId),
  });

  const candidates = simData?.candidates || [];
  const selectedRoute = candidates.find((c) => c.routeId === selectedCandidateId) || candidates[0] || {};

  // Mutation to apply reroute execution
  const applyMutation = useMutation({
    mutationFn: async ({ routeId }) => {
      const res = await apiClient.post('/simulations/apply', {
        shipmentId,
        selectedRouteId: routeId,
        rerouteNotes: 'Approved via What-If Simulation Command Deck',
      });
      return res.data;
    },
    onSuccess: (data) => {
      setApplySuccessMsg(data.message || `Reroute path ${selectedRoute.routeName} dispatched!`);
      if (onRerouteApplied) onRerouteApplied(data);
      setTimeout(() => {
        setApplySuccessMsg(null);
        onClose();
      }, 2000);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0d1321] border-l border-slate-800/60 shadow-2xl flex flex-col h-full overflow-hidden text-sans">

        {/* ── Drawer Header ────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-[#06090f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                What-If Reroute &amp; Simulation Engine
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800/40 text-emerald-400 text-[9px] font-mono rounded">
                  PRESCRIPTIVE ML
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Shipment Context: <span className="text-amber-400 font-bold">{shipmentId || 'SH-7777'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Main Content Container ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-slate-400 font-mono text-xs">
              <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
              <span>Simulating multi-objective trade-off curves...</span>
              <span className="text-[10px] text-slate-600">min Z = α·ΔC + β·ΔP - γ·ΔR</span>
            </div>
          ) : (
            <>
              {/* Objective Formula Header */}
              <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">
                    Optimization Objective Model
                  </span>
                  <p className="text-xs font-mono text-emerald-400 font-semibold mt-1">
                    min Z = 0.40·ΔC<sub>transit</sub> + 0.45·ΔP<sub>SLA</sub> - 0.15·ΔR<sub>risk</sub>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-500 block">CONFIDENCE INTERVAL</span>
                  <span className="text-xs text-slate-300 font-bold">
                    [{selectedRoute.confidenceInterval?.[0] ?? 0.89}, {selectedRoute.confidenceInterval?.[1] ?? 0.96}]
                  </span>
                </div>
              </div>

              {/* ── Candidate Route Selector ─────────────────────────── */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-slate-500" />
                  Candidate Reroute Choices
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {candidates.map((route) => {
                    const isSelected = (selectedCandidateId || simData?.optimalRouteId) === route.routeId;
                    return (
                      <div
                        key={route.routeId}
                        onClick={() => setSelectedCandidateId(route.routeId)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-950/20 border-emerald-500/80 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1 rounded-full border ${isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 text-slate-600'}`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200 text-xs">{route.routeName}</span>
                              {route.routeId === simData?.optimalRouteId && (
                                <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-800/60 text-emerald-400 text-[8px] font-mono rounded font-extrabold">
                                  OPTIMAL
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              ID: {route.routeId} · Type: {route.routeType}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-emerald-400 block">+${route.netSavings}</span>
                          <span className="text-[9px] text-slate-500 block">+{route.netRoiPercent}% ROI</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Comparative Financial Trade-Off Matrix ─────────────── */}
              <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Comparative Financial Trade-Off Matrix
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-lg p-3">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">
                      Extra Transit Cost
                    </span>
                    <span className="text-base font-extrabold font-mono text-red-400 mt-1 block">
                      +${selectedRoute.costDelta ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono mt-0.5 block">Fuel/Transit Δ</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-lg p-3">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">
                      Averted SLA Penalty
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-400 mt-1 block">
                      -${selectedRoute.slaPenaltiesSaved ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono mt-0.5 block">Penalties Saved</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-lg p-3">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">
                      Net ROI Score
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-300 mt-1 block">
                      +{selectedRoute.netRoiPercent ?? 0}%
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono mt-0.5 block">Financial Yield</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-lg p-3">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">
                      Risk Score Δ
                    </span>
                    <span className="text-base font-extrabold font-mono text-sky-400 mt-1 block">
                      -{selectedRoute.riskReductionPercentage ?? 0}%
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono mt-0.5 block">Risk Slashed</span>
                  </div>
                </div>
              </div>

              {/* ── Visual Projected Transit Time Curves ─────────────── */}
              <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
                  <Clock className="h-4 w-4 text-sky-400" />
                  Projected Transit Time Curves Comparison
                </h3>

                <div className="flex flex-col gap-3 pt-2 font-mono text-xs">
                  {/* Baseline Delayed Route Curve */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Baseline Delayed Route (Bottlenecked)</span>
                      <span className="text-red-400 font-bold">+95 mins ETA delay</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 flex">
                      <div className="bg-red-500/80 h-full transition-all duration-500" style={{ width: '85%' }} />
                    </div>
                  </div>

                  {/* Rerouted Optimized Curve */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{selectedRoute.routeName || 'Optimized Bypass'}</span>
                      <span className="text-emerald-400 font-bold">-{selectedRoute.transitTimeSavedMins ?? 45} mins saved</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 flex">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.max(25, 85 - (selectedRoute.transitTimeSavedMins || 45) / 1.5)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Notification */}
              {applySuccessMsg && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{applySuccessMsg}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── Drawer Footer CTA ────────────────────────────────────── */}
        <div className="p-5 border-t border-slate-800/60 bg-[#06090f] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            disabled={isLoading || applyMutation.isPending || !selectedRoute.routeId}
            onClick={() => applyMutation.mutate({ routeId: selectedRoute.routeId })}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 font-mono tracking-wide"
          >
            {applyMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Dispatching Reroute...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-current" />
                Approve Reroute &amp; Dispatch
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SimulationDrawer;
