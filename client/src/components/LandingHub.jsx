import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../context/ApiContext.jsx';
import {
  Search, GitCommit, AlertTriangle, CloudRain, Clock,
  Database, Cpu, ChevronRight, Package, MapPin, Zap
} from 'lucide-react';
import logisticsNetwork from '../assets/logistics_network.png';

const formatDwellTime = (seconds) => {
  if (!seconds || seconds <= 0) return 'In Transit';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} mins`;
};

const statusConfig = {
  SAFE: { textColor: 'text-emerald-500', text: 'SAFE OPERATION', colorClass: 'text-emerald-500 border-slate-800/60 bg-slate-900', borderClass: 'border-slate-800/60' },
  AT_RISK: { textColor: 'text-amber-500', text: 'AT RISK OF DELAY', colorClass: 'text-amber-500 border-slate-800/60 bg-slate-900', borderClass: 'border-slate-800/60' },
  DELAYED: { textColor: 'text-red-500', text: 'DELAYED / SLA BREACH', colorClass: 'text-red-500 border-slate-800/60 bg-slate-900', borderClass: 'border-slate-800/60' },
};

export const LandingHub = () => {
  const { openAuthGate } = useAuth();
  const { apiClient, networkStats } = useApi();

  const [shipmentIdInput, setShipmentIdInput] = useState('');
  const [searchId, setSearchId] = useState(null);

  const { data: journeyData, error, isLoading, isFetching } = useQuery({
    queryKey: ['landing-journey', searchId],
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
    if (shipmentIdInput.trim()) setSearchId(shipmentIdInput.trim());
  };

  const currentStatus = journeyData?.data?.status || 'SAFE';
  const config = statusConfig[currentStatus] || statusConfig.SAFE;

  return (
    <div className="landing-bg min-h-screen w-screen flex flex-col overflow-x-hidden bg-[#090d16]">
      {/* ── Top Strip ──────────────────────────────────────────── */}
      <header className="landing-header flex items-center justify-between px-8 h-14 shrink-0 border-b border-slate-800/60">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 8L12 3L20 8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16L12 21L20 16" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V21" stroke="#334155" strokeWidth="1" strokeDasharray="2 3"/>
          </svg>
          <span className="text-[11px] font-bold tracking-widest text-slate-300 uppercase font-sans">
            CASCADING DELAY
          </span>
        </div>

        {/* Telemetry chips */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="telemetry-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] text-emerald-500 font-bold">SYS_OK</span>
          </div>
          <div className="telemetry-chip">
            <span className="font-mono text-[10px] text-slate-400">STREAM INGEST: 12k/s</span>
          </div>
          <div className="telemetry-chip">
            <span className="font-mono text-[10px] text-amber-500">
              LATENCY: {networkStats.latencyMs !== null ? `${networkStats.latencyMs}ms` : '42ms'}
            </span>
          </div>
        </div>

        {/* Login CTA */}
        <button
          id="landing-login-btn"
          onClick={openAuthGate}
          className="landing-login-btn"
        >
          System Operator Login
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* ── Immersive Tactical Canvas Section ──────────────────── */}
      <div className="tactical-canvas-container">
        <img src={logisticsNetwork} className="tactical-canvas-img" alt="Global Logistics Network" />
        <div className="tactical-canvas-overlay" />
        
        {/* Branding Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/20 border border-emerald-900/30 rounded-full mb-6 animate-fade-slide-in">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
              NETWORK OPERATIONAL · ALL SYSTEMS NOMINAL
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight max-w-2xl leading-tight mb-3 font-sans animate-fade-slide-in">
            Global Logistics{' '}
            <span className="text-slate-400">Command Intelligence</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed font-sans animate-fade-slide-in">
            Real-time geospatial tracking, SLA breach detection, and cascade delay
            risk modeling. Enter a Serial ID to reconstruct any shipment journey.
          </p>
        </div>
      </div>

      {/* ── Operations Controls & Search Section ───────────────── */}
      <section className="flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* ── Stats Row ── */}
        <div className="flex items-center gap-6 mb-10 flex-wrap justify-center animate-fade-slide-in">
          {[
            { icon: Package, label: 'Active Shipments', value: '2,847' },
            { icon: MapPin, label: 'Network Hubs', value: '142' },
            { icon: Zap, label: 'SLA Compliance', value: '98.2%' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="landing-stat-card border border-slate-800/60 bg-slate-900">
              <Icon className="h-4 w-4 text-slate-500 mb-1" />
              <span className="text-xl font-extrabold text-slate-100 font-mono">{value}</span>
              <span className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Search Form ── */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-lg"
          style={{ animation: 'fadeSlideIn 0.55s ease-out 0.1s both' }}
        >
          <div className="landing-search-bar bg-slate-900 border border-slate-800/60">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              id="landing-search-input"
              placeholder="Enter 12-digit Serial ID  (e.g. SH-7777)..."
              value={shipmentIdInput}
              onChange={(e) => setShipmentIdInput(e.target.value)}
              className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-600 focus:outline-none font-mono"
            />
            <button
              type="submit"
              id="landing-search-btn"
              className="landing-search-submit"
              disabled={isFetching}
            >
              {isFetching ? 'Searching...' : 'Trace Shipment'}
            </button>
          </div>
          <p className="text-[10px] text-slate-700 text-center mt-2 font-mono">
            PUBLIC ACCESS · NO AUTHENTICATION REQUIRED
          </p>
        </form>
      </section>


      {/* ── Journey Result Section ─────────────────────────────── */}
      {searchId && (
        <section
          className="px-6 pb-16 w-full max-w-4xl mx-auto"
          style={{ animation: 'fadeSlideIn 0.4s ease-out both' }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div className="h-6 w-6 rounded-full border border-slate-700 border-t-slate-400 animate-spin" />
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                Reconstructing journey logs...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 bg-red-950/10 border border-red-900/30 rounded-xl text-center">
              <AlertTriangle className="h-7 w-7 text-red-500" />
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Shipment Not Found
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
                No journey data found for <span className="font-mono text-slate-400">{searchId}</span>.
                Verify the Serial ID and ensure events have been ingested.
              </p>
            </div>
          ) : journeyData?.data ? (
            <div className="flex flex-col gap-5">
              {/* Journey Header */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <GitCommit className="h-4 w-4 text-slate-500" />
                    Journey Reconstruction ·{' '}
                    <span className="font-mono text-slate-400">{searchId}</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 ml-6">
                    {journeyData.data.legs.length} transit legs · Risk score:{' '}
                    <span className={`font-mono font-bold ${config.textColor}`}>
                      {journeyData.data.riskScore}
                    </span>
                  </p>
                </div>
                <div className={`px-3 py-1 border rounded text-[10px] font-bold tracking-wider uppercase font-mono ${config.colorClass}`}>
                  {config.text}
                </div>
              </div>

              {/* Stepper */}
              <div className="relative pl-6 border-l border-slate-800/60 flex flex-col gap-5 ml-2.5">
                {journeyData.data.legs.map((leg, index) => {
                  const isLast = index === journeyData.data.legs.length - 1;
                  const isException = leg.weatherException;
                  const isDelayed = isException || (currentStatus === 'DELAYED' && index > 0);

                  return (
                    <div key={index} className="relative">
                      {/* Node dot */}
                      {isLast ? (
                        <span className="absolute -left-[30px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#090d16] border border-slate-800">
                          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full animate-pulse-ring bg-sky-500/10" />
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                            currentStatus === 'DELAYED' ? 'bg-red-500' :
                            currentStatus === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                        </span>
                      ) : (
                        <span className={`absolute -left-[27px] top-2.5 h-2 w-2 rounded-full border-2 border-[#090d16] ${
                          isException ? 'bg-red-500' : 'bg-slate-700'
                        }`} />
                      )}

                      {/* Leg block */}
                      <div className={`bg-slate-900 border rounded-lg p-3.5 flex flex-col gap-1.5 ${
                        isDelayed ? 'border-red-900/40' : 'border-slate-800/60'
                      }`}>
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[11px] font-bold ${isDelayed ? 'text-red-400' : 'text-slate-200'}`}>
                            {index === 0 ? 'Origin Hub' : isLast ? 'Current Location' : `Transit Hub ${index}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(leg.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono">
                          <div>
                            <p className={`text-[10px] font-bold ${isDelayed ? 'text-red-400' : 'text-slate-400'}`}>
                              {leg.locationId}
                            </p>
                            <p className="text-slate-600 text-[9px] mt-0.5">
                              {leg.coordinates.coordinates[1].toFixed(4)}, {leg.coordinates.coordinates[0].toFixed(4)}
                            </p>
                          </div>
                          {index < journeyData.data.legs.length - 1 && (
                            <div className="flex items-center gap-1 text-slate-500 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded text-[9px]">
                              <Clock className="h-2.5 w-2.5" />
                              {formatDwellTime(leg.dwellDuration)}
                            </div>
                          )}
                        </div>

                        {isDelayed && (
                          <p className="text-[10px] font-mono text-red-500 font-semibold">
                            REVISED ETA: {new Date(journeyData.data.currentEta).toLocaleString()}
                          </p>
                        )}

                        {leg.weatherException && (
                          <div className="flex items-center gap-2 mt-0.5 px-2.5 py-1.5 bg-red-950/20 border border-red-900/40 text-red-500 rounded text-[9px] font-mono">
                            <CloudRain className="h-3 w-3 shrink-0" />
                            WEATHER EXCEPTION DETECTED · DOWNSTREAM ETAs IMPACTED
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Source badges */}
              <div className="flex items-center gap-2 justify-end mt-1">
                {networkStats.source && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800/60 rounded text-[9px] text-slate-500 font-mono">
                    {networkStats.source === 'cache' ? <Cpu className="h-2.5 w-2.5" /> : <Database className="h-2.5 w-2.5" />}
                    {networkStats.source === 'cache' ? 'RAM Cache' : 'MongoDB'}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      {!searchId && (
        <div className="mt-auto pb-8 flex justify-center">
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-wider">
            CASCADING DELAY LOGISTICS OS · v2.1.0 · {new Date().getFullYear()}
          </p>
        </div>
      )}
    </div>
  );
};

export default LandingHub;
