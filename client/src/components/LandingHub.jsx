import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../context/ApiContext.jsx';
import LandingHero from '../features/landing/LandingHero.jsx';
import {
  Search, GitCommit, AlertTriangle, CloudRain, Clock,
  Database, Cpu, ChevronRight, Package, MapPin, Zap, TrendingUp
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
  SAFE: {
    textColor: 'text-emerald-500',
    text: 'SAFE OPERATION',
    colorClass: 'text-emerald-500 border-emerald-900/40 bg-emerald-950/10',
  },
  AT_RISK: {
    textColor: 'text-amber-500',
    text: 'AT RISK OF DELAY',
    colorClass: 'text-amber-500 border-amber-900/40 bg-amber-950/10',
  },
  DELAYED: {
    textColor: 'text-red-500',
    text: 'DELAYED / SLA BREACH',
    colorClass: 'text-red-500 border-red-900/40 bg-red-950/10',
  },
};

const STAT_CARDS = [
  {
    icon: Package,
    label: 'Active Shipments',
    value: '2,847',
    delta: '+3.2%',
    accent: 'stat-accent-safe',
    valueColor: 'text-emerald-400',
  },
  {
    icon: MapPin,
    label: 'Network Hubs',
    value: '142',
    delta: '+1 new',
    accent: 'stat-accent-neutral',
    valueColor: 'text-slate-100',
  },
  {
    icon: Zap,
    label: 'SLA Compliance',
    value: '98.2%',
    delta: '+0.4%',
    accent: 'stat-accent-safe',
    valueColor: 'text-emerald-400',
  },
  {
    icon: TrendingUp,
    label: 'Avg Delay Risk',
    value: '12.4',
    delta: '-2.1 pts',
    accent: 'stat-accent-risk',
    valueColor: 'text-amber-400',
  },
];

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

      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="landing-header flex items-center justify-between px-8 h-14 shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <path d="M5 9L14 3.5L23 9" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 18.5L14 24L23 18.5" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 3.5V24" stroke="#334155" strokeWidth="1" strokeDasharray="2.5 3.5"/>
            <circle cx="14" cy="13.5" r="2" fill="none" stroke="#475569" strokeWidth="1"/>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase font-sans">
              CASCADING DELAY
            </span>
            <span className="text-[8px] font-mono text-slate-600 tracking-widest mt-0.5">
              LOGISTICS COMMAND OS · v3.0
            </span>
          </div>
        </div>

        {/* Center Telemetry Chips */}
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="telemetry-chip">
            <span className="telemetry-status-dot" />
            <span className="font-mono text-[10px] text-emerald-500 font-bold tracking-wider">SYS_OK</span>
          </div>
          <div className="telemetry-chip">
            <span className="font-mono text-[10px] text-slate-400 tracking-wide">STREAM INGEST: 12k/s</span>
          </div>
          <div className="telemetry-chip">
            <span className="font-mono text-[10px] text-amber-500 tracking-wide">
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
          <span className="hidden sm:inline">System Operator Login</span>
          <span className="sm:hidden">Login</span>
          <ChevronRight className="h-3.5 w-3.5 login-chevron" />
        </button>
      </header>

      {/* ── Landing Hero with Animated Vector Topology Grid ─────── */}
      <LandingHero
        onSearch={(id) => setSearchId(id)}
        journeyData={journeyData}
        isLoading={isLoading}
        isError={Boolean(error)}
      />


      {/* ── Journey Result Section ──────────────────────────────── */}
      {searchId && (
        <section
          className="px-6 pb-20 w-full max-w-4xl mx-auto animate-fade-slide-in"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div className="h-6 w-6 rounded-full border border-slate-700 border-t-emerald-500 animate-spin-slow" />
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Reconstructing journey logs...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4 bg-red-950/10 border border-red-900/30 rounded-xl text-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest font-mono">
                Shipment Not Found
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
                No journey data found for{' '}
                <span className="font-mono text-slate-400">{searchId}</span>.
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
                <div className={`px-3 py-1.5 border rounded-md text-[10px] font-bold tracking-widest uppercase font-mono ${config.colorClass}`}>
                  {config.text}
                </div>
              </div>

              {/* Stepper */}
              <div className="relative pl-6 border-l border-slate-800/50 flex flex-col gap-5 ml-2.5">
                {journeyData.data.legs.map((leg, index) => {
                  const isLast = index === journeyData.data.legs.length - 1;
                  const isException = leg.weatherException;
                  const isDelayed = isException || (currentStatus === 'DELAYED' && index > 0);

                  return (
                    <div key={index} className="relative animate-fade-slide-in" style={{ animationDelay: `${index * 0.06}s` }}>
                      {/* Node dot */}
                      {isLast ? (
                        <span className="absolute -left-[30px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#090d16] border border-slate-800">
                          <span className="absolute inline-flex h-4 w-4 rounded-full animate-pulse-ring bg-sky-500/5" />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            currentStatus === 'DELAYED' ? 'bg-red-500' :
                            currentStatus === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                        </span>
                      ) : (
                        <span className={`absolute -left-[27px] top-3 h-2 w-2 rounded-full border-2 border-[#090d16] ${
                          isException ? 'bg-red-500' : 'bg-slate-700'
                        }`} />
                      )}

                      {/* Leg block */}
                      <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                        isDelayed
                          ? 'border-red-900/40 border-l-2 border-l-red-500/50'
                          : 'border-slate-800/60'
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
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-900 border border-slate-800/60 px-2.5 py-1 rounded-md text-[9px]">
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
                          <div className="flex items-center gap-2 mt-0.5 px-3 py-2 bg-red-950/20 border border-red-900/40 text-red-500 rounded-lg text-[9px] font-mono">
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
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800/60 rounded-md text-[9px] text-slate-500 font-mono">
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
        <div className="mt-auto pb-10 flex justify-center">
          <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">
            CASCADING DELAY LOGISTICS OS · v3.0.0 · {new Date().getFullYear()} · ALL CHANNELS ENCRYPTED
          </p>
        </div>
      )}
    </div>
  );
};

export default LandingHub;
