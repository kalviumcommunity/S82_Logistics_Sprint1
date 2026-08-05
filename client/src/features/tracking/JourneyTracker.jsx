import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import { 
  Search, GitCommit, AlertTriangle, CloudRain, Clock, Database, Cpu, Compass
} from 'lucide-react';
import JourneyMap from './JourneyMap.jsx';

export const JourneyTracker = () => {
  const { apiClient, networkStats } = useApi();
  const [shipmentIdInput, setShipmentIdInput] = useState('SH-7777');
  const [searchId, setSearchId] = useState('SH-7777');

  // Fetch shipment journey details
  const { data: journeyData, error, isLoading, isFetching } = useQuery({
    queryKey: ['shipment-journey', searchId],
    queryFn: async () => {
      if (!searchId) return null;
      const res = await apiClient.get(`/shipments/${searchId}/journey`);
      return res.data;
    },
    enabled: !!searchId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (shipmentIdInput.trim()) {
      setSearchId(shipmentIdInput.trim());
    }
  };

  const formatDwellTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'In Transit';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} mins`;
  };

  const statusConfig = {
    SAFE: {
      colorClass: 'text-emerald-500 border-slate-800/60 bg-slate-900',
      text: 'SAFE OPERATION',
      borderClass: 'border-slate-800/60',
      textColor: 'text-emerald-500',
    },
    AT_RISK: {
      colorClass: 'text-amber-500 border-slate-800/60 bg-slate-900',
      text: 'AT RISK OF DELAY',
      borderClass: 'border-slate-800/60',
      textColor: 'text-amber-500',
    },
    DELAYED: {
      colorClass: 'text-red-550 border-red-900/40 bg-red-950/20',
      text: 'DELAYED / SLA VIOLATION',
      borderClass: 'border-red-900/40',
      textColor: 'text-red-500',
    },
  };

  const currentStatus = journeyData?.data?.status || 'SAFE';
  const config = statusConfig[currentStatus] || statusConfig.SAFE;

  return (
    <div className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6 font-sans">
      
      {/* Header Info Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Compass className="h-5 w-5 text-slate-400" />
            Shipment Journey Reconstruction
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological multi-leg tracking sequence and delay risk engine status.
          </p>
        </div>

        {/* Telemetry Metrics Badges */}
        <div className="flex items-center gap-3">
          {networkStats.source && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${
              networkStats.source === 'cache' 
                ? 'bg-slate-900 text-slate-400 border-slate-800/60' 
                : 'bg-slate-900 text-slate-400 border-slate-800/60'
            }`}>
              {networkStats.source === 'cache' ? (
                <>
                  <Cpu className="h-3 w-3" />
                  Source: RAM Cache
                </>
              ) : (
                <>
                  <Database className="h-3 w-3" />
                  Source: MongoDB Grid
                </>
              )}
            </div>
          )}

          {networkStats.latencyMs !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-800 bg-[#0f172a] text-slate-400 text-[10px] font-mono font-semibold">
              <Clock className="h-3 w-3 text-slate-500" />
              LATENCY: {networkStats.latencyMs}ms
            </div>
          )}
        </div>
      </div>

      {/* Lookup Form Field */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Shipment ID (e.g. SH-7777)..."
            value={shipmentIdInput}
            onChange={(e) => setShipmentIdInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800/60 focus:border-slate-700 rounded-lg text-slate-100 text-xs placeholder-slate-500 focus:outline-none transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-lg text-xs transition-all cursor-pointer"
        >
          {isFetching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Main Stepper Board */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 bg-slate-900/40 border border-slate-800/60 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-slate-400"></div>
          <p className="text-xs text-slate-500 font-mono uppercase">Reconstructing logs...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 bg-red-950/10 border border-red-900/40 rounded-lg text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Shipment Journey Not Found</h3>
          <p className="text-[11px] text-red-300 max-w-sm leading-normal">
            The target shipment ID could not be loaded. Please ensure events have been ingested via the gateway first.
          </p>
        </div>
      ) : journeyData?.data ? (
        <div className="flex flex-col gap-6">
          
          <JourneyMap legs={journeyData.data.legs} currentStatus={currentStatus} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Timeline Display Card */}
            <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800/60 rounded-lg p-5 flex flex-col gap-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <GitCommit className="h-4.5 w-4.5 text-slate-450" />
              Chronological Path Reconstruction
            </h2>

            {/* Stepper Timeline */}
            <div className="relative pl-6 border-l border-slate-850 flex flex-col gap-6 ml-2.5">
              {journeyData.data.legs.map((leg, index) => {
                const isLast = index === journeyData.data.legs.length - 1;
                // Leg is considered impacted if it registers an exception or comes after one in a delayed journey
                const isException = leg.weatherException;
                const isDelayed = isException || (currentStatus === 'DELAYED' && index > 0);

                return (
                  <div key={index} className="relative group">
                    
                    {/* Tiny sharp structural dot node */}
                    {isLast ? (
                      <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#090d16] border border-slate-850">
                        <span className="absolute inline-flex h-3.5 w-3.5 rounded-full animate-pulse-ring bg-sky-500/20"></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${currentStatus === 'DELAYED' ? 'bg-red-500' : currentStatus === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                      </span>
                    ) : (
                      <span className={`absolute -left-[27px] top-2 h-2.5 w-2.5 rounded-full border-2 border-[#090d16] ${
                        isException ? 'bg-red-500' : 'bg-slate-700'
                      }`} />
                    )}

                    {/* Leg Detail Block */}
                    <div className={`bg-[#090d16] border rounded-lg p-3 flex flex-col gap-1.5 transition-all ${
                      isDelayed 
                        ? 'border-red-900/40 text-red-500' 
                        : 'border-slate-800/60 text-slate-350'
                    }`}>
                      <div className="flex items-center justify-between gap-4">
                        <span className={`text-[11px] font-bold ${isDelayed ? 'text-red-400' : 'text-slate-200'}`}>
                          {index === 0 ? 'Start Hub' : isLast ? 'Current Location' : `Hub Leg ${index}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(leg.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className={`text-[10px] font-bold ${isDelayed ? 'text-red-400' : 'text-slate-400'}`}>
                            Location ID: {leg.locationId}
                          </p>
                          <p className="text-slate-550 text-[9px] mt-0.5">
                            Coords: {leg.coordinates.coordinates[1].toFixed(4)}, {leg.coordinates.coordinates[0].toFixed(4)}
                          </p>
                        </div>

                        {/* Dwell details */}
                        {index < journeyData.data.legs.length - 1 && (
                          <div className="flex items-center gap-1 text-slate-400 bg-slate-900/50 border border-slate-850 px-2 py-0.5 rounded">
                            <Clock className="h-3 w-3 text-slate-500 font-mono" />
                            <span className="text-[9px]">Dwell: {formatDwellTime(leg.dwellDuration)}</span>
                          </div>
                        )}
                      </div>

                      {/* Monospace revised ETA if delayed */}
                      {isDelayed && (
                        <div className="text-[10px] font-mono text-red-500 font-semibold mt-1">
                          REVISED ETA: {new Date(journeyData.data.currentEta).toLocaleString()}
                        </div>
                      )}

                      {/* Weather exception warning banner */}
                      {leg.weatherException && (
                        <div className="flex items-center gap-2 mt-1 px-2.5 py-1.5 bg-red-950/20 border border-red-900/40 text-red-500 rounded text-[9px] font-mono">
                          <CloudRain className="h-3.5 w-3.5 shrink-0" />
                          <span>WEATHER EXCEPTION DETECTED: IMPACTING DOWNSTREAM ETAs</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Risk Summary Panel */}
          <div className="flex flex-col gap-6">
            
            {/* Risk Index Gauge Card */}
            <div className="bg-[#0f172a] border border-slate-800/60 rounded-lg p-5 flex flex-col items-center justify-center gap-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Dynamic Delay Risk
              </span>
              
              <div className="relative flex items-center justify-center">
                <div className="flex flex-col items-center justify-center h-24 w-24 rounded-full border border-slate-800/60 bg-[#090d16] font-mono">
                  <span className={`text-3xl font-extrabold ${config.textColor}`}>
                    {journeyData.data.riskScore}
                  </span>
                  <span className="text-[9px] text-slate-550 font-bold mt-0.5">SCORE</span>
                </div>
              </div>

              {/* Status Classification Tag */}
              <div className={`px-3 py-1 border rounded text-[10px] font-bold tracking-wider uppercase font-mono ${config.colorClass}`}>
                {config.text}
              </div>

              {/* ETA Display */}
              <div className="w-full mt-2 pt-3 border-t border-slate-800/60 flex flex-col gap-1 text-left font-mono">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Estimated ETA (REVISED)
                </span>
                <span className={`text-xs font-semibold ${currentStatus === 'DELAYED' ? 'text-red-550' : 'text-slate-200'}`}>
                  {new Date(journeyData.data.currentEta).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Info card describing cascade metrics */}
            <div className="bg-[#0f172a] border border-slate-800/60 rounded-lg p-4 flex flex-col gap-2.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Platform Risk Algorithm
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Risk score weights reflect active bottlenecks along transit networks. High queue densities, severe climate alerts, and target delivery breaches compound points. Scores above 35 indicate dynamic warnings, while scores exceeding 70 trigger automatic delay declarations.
              </p>
            </div>

          </div>

          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-slate-800 rounded-lg bg-[#0f172a]">
          <GitCommit className="h-8 w-8 text-slate-700" />
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase">No Active Shipment Selected</p>
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">Enter a Shipment ID above to reconstruct timeline.</p>
        </div>
      )}
    </div>
  );
};

export default JourneyTracker;
