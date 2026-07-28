import React, { useState } from 'react';
import { Search, MapPin, CheckCircle2, Clock, AlertTriangle, ShieldCheck, ChevronRight, PackageCheck, Radio } from 'lucide-react';

export const LandingHero = ({ onSearch, journeyData, isLoading, isError }) => {
  const [trackingInput, setTrackingInput] = useState('LGS-8842-XT9');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      onSearch(trackingInput.trim());
    }
  };

  const sampleTrackingNumbers = ['LGS-8842-XT9', 'SH-7777', 'LGS-9012-HQ3', 'LGS-4411-WH2'];

  const journey = journeyData?.data;
  const legs = journey?.legs || [];
  const status = journey?.status || 'NORMAL';

  return (
    <div className="relative w-full max-w-7xl mx-auto px-6 pt-8 pb-12 flex flex-col gap-10 font-sans">
      
      {/* Top Banner Tag */}
      <div className="flex items-center gap-2 self-start px-3 py-1 bg-slate-900/90 border border-slate-800/80 rounded-full shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-chip-blink" />
        <span className="font-mono text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          CASCADING DELAY INTELLIGENCE ENGINE v4.2
        </span>
      </div>

      {/* Hero Header + Animated SVG Vector Topology Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left 7 Columns: Title & Search Bar */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-100 uppercase font-sans leading-none">
              Predict &amp; Contain <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400">
                Cascading Logistics Delays
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed mt-2 font-sans">
              Real-time route risk evaluation, automated warehouse transfer tracking, and delay propagation prediction powered by Redis Streams &amp; Express telemetry.
            </p>
          </div>

          {/* High-Precision Search Bar */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xl">
            <label className="data-label text-slate-400 flex items-center justify-between">
              <span>ENTER 12-DIGIT TRACKING ID OR SHIPMENT SERIAL</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">SERIAL_FORMAT: LGS-XXXX-XXX</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                placeholder="e.g. LGS-8842-XT9"
                className="w-full bg-[#0d1321] border border-slate-800/60 rounded-lg px-5 py-3.5 pl-12 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 transition-all shadow-xl"
              />
              <Search className="absolute left-4 h-5 w-5 text-slate-500" />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 px-4 py-2 bg-slate-800 hover:bg-emerald-600 border border-slate-700/60 rounded-lg text-xs font-mono font-bold text-slate-200 hover:text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-slate-400 border-t-emerald-400 rounded-full animate-spin" />
                    Querying...
                  </span>
                ) : (
                  <>
                    <span>INSPECT JOURNEY</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Tracking Shortcuts */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-slate-600 uppercase">Sample Serials:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {sampleTrackingNumbers.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setTrackingInput(s); onSearch(s); }}
                    className="px-2 py-0.5 bg-[#0d1321] border border-slate-800/60 hover:border-slate-700 rounded text-[9px] font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Right 5 Columns: Interactive Vector Global Topology Map Graphic */}
        <div className="lg:col-span-5 relative w-full h-[320px] bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 overflow-hidden flex flex-col justify-between shadow-2xl">
          {/* SVG Abstract Topology Vector Grid */}
          <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 600 400" fill="none">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
              </pattern>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Vector Route Lines */}
            <path d="M 80 280 Q 200 120 320 220 T 520 100" stroke="url(#routeGradient)" strokeWidth="2.5" fill="none" strokeDasharray="6 4" className="animate-pulse" />
            <path d="M 120 100 Q 280 300 480 280" stroke="#334155" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />

            {/* Hub Nodes */}
            <circle cx="80" cy="280" r="5" fill="#10b981" />
            <circle cx="320" cy="220" r="6" fill="#f59e0b" />
            <circle cx="520" cy="100" r="5" fill="#ef4444" />

            {/* Node Labels */}
            <text x="70" y="305" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">HQ-GLOBAL [ORD]</text>
            <text x="310" y="245" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">WH-FRANKFURT [FRA]</text>
            <text x="480" y="85" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold">DEST-SINGAPORE [SIN]</text>
          </svg>

          {/* Top Overlay Badge */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                LIVE TOPOLOGY VECTOR GRID
              </span>
            </div>
            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              3 ACTIVE LEGS
            </span>
          </div>

          {/* Bottom Card Summary Overlay */}
          <div className="relative z-10 bg-[#06090f]/90 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[9px] font-mono text-slate-500 uppercase">ACTIVE SHIPMENT INSPECTED</p>
              <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{journey?.shipmentId || 'SH-7777'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-slate-500 uppercase">CONTAINMENT RISK</p>
              <p className={`text-xs font-mono font-extrabold ${journey?.currentRiskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                {journey?.currentRiskScore ? `${journey.currentRiskScore} / 100` : '18 / 100 (NOMINAL)'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Vertical Stepper Timeline Expansion */}
      {journey && (
        <div className="bg-[#0d1321] border border-slate-800/60 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  Shipment Journey Timeline · {journey.shipmentId}
                </h3>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                  ORIGIN: {journey.origin} → DESTINATION: {journey.destination}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 border rounded-lg text-xs font-mono font-bold ${
              status === 'CRITICAL_DELAY' ? 'bg-red-950/30 text-red-400 border-red-900/40' :
              status === 'DELAY_RISK'     ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' :
                                            'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
            }`}>
              {status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {legs.length > 0 ? (
              legs.map((leg, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-500 uppercase">LEG {idx + 1}</span>
                    <span className={`text-[10px] font-mono font-bold ${leg.status === 'DELAYED' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {leg.status || 'NORMAL'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {leg.locationId}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-600" />
                    {new Date(leg.timestamp).toLocaleString()}
                  </p>
                  {leg.delayReason && (
                    <p className="text-[10px] font-mono text-amber-400 bg-amber-950/20 border border-amber-900/40 px-2 py-1 rounded mt-1">
                      REASON: {leg.delayReason}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-6 text-slate-500 font-mono text-xs">
                No intermediate scanning events recorded yet for this journey.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingHero;
