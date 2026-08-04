import React, { useState } from 'react';
import { Search, MapPin, CheckCircle2, Clock, AlertTriangle, ShieldCheck, ChevronRight, PackageCheck, Radio } from 'lucide-react';
import predictiveMeshImg from '../../assets/predictive_analytics_mesh.png';

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
          PREDICTIVE OPERATIONS RESEARCH ENGINE v4.2
        </span>
      </div>

      {/* Hero Header + Generative Mesh Graphic */}
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
              Real-time route risk evaluation, automated warehouse transfer tracking, and delay propagation prediction powered by high-velocity Machine Learning risk engines &amp; Operations Research delay propagation models.
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

        {/* Right 5 Columns: Generative Mesh Graphics Card */}
        <div className="lg:col-span-5 relative w-full h-[320px] bg-[#0d1321] border border-slate-800/60 rounded-xl p-3 overflow-hidden flex flex-col justify-between shadow-2xl group">
          <img
            src={predictiveMeshImg}
            alt="Predictive Analytics Network Mesh"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1321] via-transparent to-[#0d1321]/60" />

          {/* Top Overlay Badge */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800/60 pb-2.5 bg-[#06090f]/70 backdrop-blur-md p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-slate-200 uppercase tracking-widest">
                PREDICTIVE NETWORK TOPOLOGY
              </span>
            </div>
            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
              ML MODEL ONLINE
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
