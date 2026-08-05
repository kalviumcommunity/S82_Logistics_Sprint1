import React from 'react';
import {
  GitCommit, Clock, CloudRain, AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight
} from 'lucide-react';

/**
 * Vertical Journey Stepper Timeline with Predictive Bottleneck Highlights for Downstream Nodes
 */
export const JourneyStepper = ({ journeyData, riskAnalysis }) => {
  if (!journeyData || !journeyData.legs) return null;

  const legs = journeyData.legs;
  const currentRiskScore = journeyData.riskScore ?? journeyData.currentRiskScore ?? riskAnalysis?.overallRiskScore ?? 0;
  const currentStatus = journeyData.status || riskAnalysis?.status || 'SAFE';
  const impactedNodes = riskAnalysis?.impactedDownstreamNodes || [];

  const formatDwellTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'In Transit';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} mins`;
  };

  // Construct projected downstream nodes list if journey is in transit
  const lastLeg = legs[legs.length - 1] || {};
  const projectedDownstreamNodes = [
    {
      locationId: 'HUB-DETROIT',
      name: 'Detroit Transfer Hub',
      predictedStatus: currentRiskScore >= 70 ? 'CRITICAL' : currentRiskScore >= 40 ? 'AT_RISK' : 'SAFE',
      estimatedArrival: new Date(Date.now() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      locationId: 'HUB-NEWYORK',
      name: 'NY East Terminal',
      predictedStatus: currentRiskScore >= 70 ? 'CRITICAL' : 'SAFE',
      estimatedArrival: new Date(Date.now() + 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  return (
    <div className="bg-[#0f172a] border border-slate-800/60 rounded-lg p-5 flex flex-col gap-5 font-sans">
      
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <GitCommit className="h-4.5 w-4.5 text-slate-400" />
          Chronological Path &amp; Downstream Predictive Stepper
        </h2>
        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">
          LIVE TELEMETRY SYNC
        </span>
      </div>

      {/* Vertical Stepper Container */}
      <div className="relative pl-6 border-l border-slate-800 flex flex-col gap-6 ml-2.5">
        
        {/* Historical & Current Legs */}
        {legs.map((leg, index) => {
          const isLast = index === legs.length - 1;
          const isException = leg.weatherException;
          const isLegDelayed = isException || (currentStatus === 'DELAYED' && index > 0);

          return (
            <div key={index} className="relative group">
              
              {/* Stepper Dot */}
              {isLast ? (
                <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#090d16] border border-slate-800">
                  <span className={`absolute inline-flex h-3.5 w-3.5 rounded-full animate-pulse-ring ${
                    currentStatus === 'DELAYED' ? 'bg-red-500/30' : currentStatus === 'AT_RISK' ? 'bg-amber-500/30' : 'bg-emerald-500/30'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    currentStatus === 'DELAYED' ? 'bg-red-500' : currentStatus === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
              ) : (
                <span className={`absolute -left-[27px] top-2 h-2.5 w-2.5 rounded-full border-2 border-[#090d16] ${
                  isException ? 'bg-red-500' : 'bg-slate-700'
                }`} />
              )}

              {/* Leg Detail Card */}
              <div className={`bg-[#090d16] border rounded-lg p-3 flex flex-col gap-1.5 transition-all ${
                isLegDelayed ? 'border-red-900/40 text-red-400' : 'border-slate-800/60 text-slate-300'
              }`}>
                
                <div className="flex items-center justify-between gap-4">
                  <span className={`text-[11px] font-bold ${isLegDelayed ? 'text-red-400' : 'text-slate-200'}`}>
                    {index === 0 ? 'Origin Hub' : isLast ? 'Current Active Node' : `Transit Leg ${index}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(leg.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <div>
                    <p className={`text-[10px] font-bold ${isLegDelayed ? 'text-red-400' : 'text-slate-400'}`}>
                      Facility: {leg.locationId}
                    </p>
                    {leg.coordinates && leg.coordinates.coordinates && (
                      <p className="text-slate-500 text-[9px] mt-0.5">
                        GPS: {leg.coordinates.coordinates[1].toFixed(4)}, {leg.coordinates.coordinates[0].toFixed(4)}
                      </p>
                    )}
                  </div>

                  {index < legs.length - 1 && (
                    <div className="flex items-center gap-1 text-slate-400 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded">
                      <Clock className="h-3 w-3 text-slate-500 font-mono" />
                      <span className="text-[9px]">Dwell: {formatDwellTime(leg.dwellDuration)}</span>
                    </div>
                  )}
                </div>

                {isLegDelayed && (
                  <div className="text-[10px] font-mono text-red-400 font-semibold mt-1">
                    REVISED PROJECTED ETA: {new Date(journeyData.currentEta || Date.now() + 3600000).toLocaleString()}
                  </div>
                )}

                {isException && (
                  <div className="flex items-center gap-2 mt-1 px-2.5 py-1.5 bg-red-950/30 border border-red-900/40 text-red-400 rounded text-[9px] font-mono">
                    <CloudRain className="h-3.5 w-3.5 shrink-0" />
                    <span>WEATHER EXCEPTION LOGGED AT THIS FACILITY</span>
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* Predictive Downstream Timeline Nodes */}
        <div className="border-t border-dashed border-slate-800 pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">
            <ArrowRight className="h-3.5 w-3.5" />
            Predictive Downstream Route Nodes (Cascading Bottleneck Warning)
          </div>

          {projectedDownstreamNodes.map((pNode, pIdx) => {
            const isCritical = pNode.predictedStatus === 'CRITICAL' || currentStatus === 'DELAYED';
            const isAtRisk = pNode.predictedStatus === 'AT_RISK' || currentStatus === 'AT_RISK';

            return (
              <div key={pIdx} className="relative group">
                
                {/* Pulsing ring highlight node */}
                <span className="absolute -left-[30px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#090d16] border border-slate-800">
                  {isCritical ? (
                    <>
                      <span className="absolute inline-flex h-4 w-4 rounded-full animate-ping bg-red-500/40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </>
                  ) : isAtRisk ? (
                    <>
                      <span className="absolute inline-flex h-4 w-4 rounded-full animate-pulse bg-amber-500/40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                  )}
                </span>

                {/* Card with Warning Badge */}
                <div className={`bg-[#06090f] border rounded-lg p-3 flex flex-col gap-1.5 transition-all ${
                  isCritical
                    ? 'border-red-900/60 bg-red-950/10'
                    : isAtRisk
                    ? 'border-amber-900/60 bg-amber-950/10'
                    : 'border-slate-800/60'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 font-mono">
                      Target Hub: {pNode.name} ({pNode.locationId})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Est. Arrival: {pNode.estimatedArrival}
                    </span>
                  </div>

                  {/* Warning Badges before shipment reaches this node */}
                  {isCritical ? (
                    <div className="flex items-center justify-between mt-1 px-2.5 py-1.5 bg-red-950/40 border border-red-900/50 rounded text-[10px] font-mono text-red-400">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                        <span className="font-extrabold uppercase">CASCADING BOTTLENECK PREDICTED</span>
                      </div>
                      <span className="text-[9px] bg-red-950 px-1.5 py-0.5 border border-red-800 rounded font-bold">
                        HIGH QUEUE CONGESTION
                      </span>
                    </div>
                  ) : isAtRisk ? (
                    <div className="flex items-center justify-between mt-1 px-2.5 py-1.5 bg-amber-950/40 border border-amber-900/50 rounded text-[10px] font-mono text-amber-400">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        <span className="font-extrabold uppercase font-mono">DOWNSTREAM IMPACT POTENTIAL</span>
                      </div>
                      <span className="text-[9px] bg-amber-950 px-1.5 py-0.5 border border-amber-800 rounded font-bold">
                        AMBER BUFFER RING
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Capacity Normal - On Schedule</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default JourneyStepper;
