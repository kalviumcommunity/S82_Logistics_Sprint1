import React from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { ShieldAlert, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlertToastContainer = () => {
  const { activeAlerts, clearAlert } = useSocket();
  const navigate = useNavigate();

  if (!activeAlerts || activeAlerts.length === 0) {
    return null;
  }

  // Display top 3 alerts in floating stack to prevent viewport overcrowding
  const visibleAlerts = activeAlerts.slice(0, 3);

  const handleInspect = (shipmentId) => {
    if (shipmentId) {
      navigate(`/tracking?shipmentId=${shipmentId}`);
    } else {
      navigate('/tracking');
    }
  };

  return (
    <div className="fixed top-16 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {visibleAlerts.map((alert) => {
        const timestampStr = alert.timestamp.includes('T')
          ? new Date(alert.timestamp).toLocaleTimeString()
          : alert.timestamp;

        return (
          <div
            key={alert.id}
            className="pointer-events-auto w-full bg-[#090d16]/95 border border-red-500/50 shadow-2xl rounded-lg p-3.5 flex flex-col gap-2 backdrop-blur-md transition-all animate-toast-slide"
          >
            {/* Header row with pulsing beacon indicator and dismiss */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </div>
                <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-red-400 shrink-0" />
                  CASCADE ALERT · RISK {alert.riskScore}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400">{timestampStr}</span>
                <button
                  onClick={() => clearAlert(alert.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  title="Dismiss Alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Body detail */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
                  {alert.shipmentId}
                </span>
                <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-1.5 py-0.2 rounded uppercase">
                  {alert.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                {alert.delayReason}
              </p>
              {alert.locationId && (
                <span className="text-[9px] font-mono text-slate-400">
                  LOCATION: {alert.locationId}
                </span>
              )}
            </div>

            {/* Footer action button */}
            <div className="flex justify-end pt-1 border-t border-slate-800/60">
              <button
                onClick={() => handleInspect(alert.shipmentId)}
                className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-400 hover:text-sky-300 bg-sky-950/30 hover:bg-sky-900/40 border border-sky-800/50 px-2.5 py-1 rounded transition-all cursor-pointer"
              >
                <span>Inspect Bottleneck</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertToastContainer;
