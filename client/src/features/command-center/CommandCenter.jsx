import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldAlert, Activity, BarChart3, AlertCircle, Truck, RefreshCw, Clock
} from 'lucide-react';

import { RiskBreakdownModal } from './RiskBreakdownModal.jsx';

// Sharp non-glowing dot icons for the map
const createDotIcon = (color) => {
  const colorHex = color === 'red' ? '#ef4444' : color === 'amber' ? '#f59e0b' : '#10b981';
  return L.divIcon({
    html: `
      <div style="position:relative;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">
        <span style="display:block;width:8px;height:8px;border-radius:50%;background:${colorHex};border:2px solid #090d16;box-shadow:0 0 4px ${colorHex}80;"></span>
      </div>
    `,
    className: 'custom-dot-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// High-fidelity mock datasets
const inboundShipments = [
  { id: 'LGS-8842-XT9', origin: 'Chicago Central Hub',      eta: '14:32:10', delay: '42m', status: 'DELAYED'  },
  { id: 'LGS-1024-CH4', origin: 'Detroit Depot',            eta: '15:45:00', delay: '0m',  status: 'SAFE'     },
  { id: 'LGS-7777-NY1', origin: 'New York East Terminal',   eta: '16:15:32', delay: '12m', status: 'AT_RISK'  },
  { id: 'LGS-9051-LA3', origin: 'Los Angeles Port',         eta: '17:00:15', delay: '0m',  status: 'SAFE'     },
  { id: 'LGS-4112-TX7', origin: 'Houston South Yard',       eta: '18:30:00', delay: '55m', status: 'DELAYED'  },
];

const outboundShipments = [
  { id: 'LGS-2041-TR5', destination: 'Dallas Central Terminal', departure: '14:50:00', carrier: 'FedEx Freight', status: 'SAFE'    },
  { id: 'LGS-3392-PL1', destination: 'Seattle North Depot',     departure: '15:30:00', carrier: 'DHL Express',   status: 'SAFE'    },
  { id: 'LGS-5582-QW9', destination: 'Miami South Hub',         departure: '16:45:00', carrier: 'UPS Ground',    status: 'AT_RISK' },
  { id: 'LGS-8810-AZ2', destination: 'Phoenix West Yard',       departure: '18:10:00', carrier: 'Swift Transit',  status: 'DELAYED' },
];

const interventions = [
  { id: 'INT-402', shipmentId: 'SH-8842', route: 'CHI-DET (Direct Rail Link)',    cost: '+$450', avertedPenalties: '-$1,200', netSaving: '+$750', action: 'REROUTE'  },
  { id: 'INT-709', shipmentId: 'SH-1024', route: 'DET-NY (Air Express Cargo)',    cost: '+$650', avertedPenalties: '-$1,200', netSaving: '+$550', action: 'UPGRADE'  },
  { id: 'INT-311', shipmentId: 'SH-7777', route: 'NY-BOS (Local Courier Relay)', cost: '+$180', avertedPenalties: '-$800',   netSaving: '+$620', action: 'DISPATCH' },
];

const renderStatusTag = (status, onClick) => {
  if (status === 'SAFE') {
    return <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] font-mono">SAFE</span>;
  }
  if (status === 'AT_RISK') {
    return (
      <button
        onClick={onClick}
        title="Click to view predictive risk breakdown"
        className="px-1.5 py-0.5 border border-amber-900/40 bg-amber-950/30 text-amber-500 hover:text-amber-300 font-bold uppercase tracking-widest text-[9px] rounded font-mono cursor-pointer transition-all hover:scale-105"
      >
        AT_RISK
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title="Click to view predictive risk breakdown"
      className="px-1.5 py-0.5 border border-red-900/40 bg-red-950/20 text-red-500 hover:text-red-300 font-bold uppercase tracking-widest text-[9px] rounded font-mono cursor-pointer transition-all hover:scale-105"
    >
      DELAYED
    </button>
  );
};

export const CommandCenter = () => {
  const { apiClient } = useApi();
  const { socket } = useSocket();

  const [selectedRiskShipmentId, setSelectedRiskShipmentId] = useState(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const handleOpenRiskModal = (shipmentId) => {
    setSelectedRiskShipmentId(shipmentId);
    setIsRiskModalOpen(true);
  };

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      shipmentId: 'SH-1024',
      riskScore: 78,
      status: 'DELAYED',
      timestamp: '16:15:32',
      message: 'Chicago Transit congestion compounding delay thresholds.',
    },
    {
      id: 2,
      shipmentId: 'SH-8842',
      riskScore: 82,
      status: 'DELAYED',
      timestamp: '16:30:11',
      message: 'Severe weather exception registered at Chicago Hub.',
    },
  ]);
  const [activeToast, setActiveToast] = useState(null);

  // Fetch warehouses
  const { data: warehousesRes, refetch: refetchWarehouses, isLoading: isLoadingWH } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const warehouses = warehousesRes?.data || [];

  // Fetch active route
  const { data: journeyRes } = useQuery({
    queryKey: ['fleet-shipment-journey'],
    queryFn: async () => {
      const res = await apiClient.get('/shipments/SH-7777/journey').catch(() => null);
      return res?.data || null;
    },
  });

  const journeyLegs = journeyRes?.data?.legs || [];
  const mapCenter   = [39.8283, -98.5795];
  const mapZoom     = 4;

  // Socket telemetry alerts
  useEffect(() => {
    if (!socket) return;

    const handleCascadeAlert = (payload) => {
      const newAlert = {
        id: payload.id || Date.now(),
        shipmentId: payload.shipmentId || 'SH-UNKNOWN',
        riskScore: payload.riskScore ?? 80,
        status: payload.status || 'DELAYED',
        timestamp: payload.timestamp
          ? (payload.timestamp.includes('T') ? new Date(payload.timestamp).toLocaleTimeString() : payload.timestamp)
          : new Date().toLocaleTimeString(),
        message: payload.delayReason || `Critical risk score alert: ${payload.riskScore}% at ${payload.locationId || 'terminal'}`,
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 10));
    };

    socket.on('cascade:alert', handleCascadeAlert);
    socket.on('risk:update', (journey) => {
      const rScore = journey.currentRiskScore ?? journey.riskScore;
      if (rScore >= 70 || journey.status === 'DELAYED' || journey.status === 'CRITICAL_DELAY') {
        handleCascadeAlert({
          shipmentId: journey.shipmentId,
          riskScore: rScore,
          status: journey.status,
          locationId: journey.legs?.[journey.legs.length - 1]?.locationId,
          delayReason: 'Cascading Route Risk Threshold Exceeded',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    });

    return () => {
      socket.off('cascade:alert', handleCascadeAlert);
      socket.off('risk:update');
    };
  }, [socket]);

  const polylinePositions = journeyLegs.map(leg => [
    leg.coordinates.coordinates[1],
    leg.coordinates.coordinates[0],
  ]);

  const now = new Date().toLocaleTimeString();

  return (
    <div className="p-6 w-full flex flex-col gap-6 max-w-7xl mx-auto font-sans">

      {/* Toast Exception Banner */}
      {activeToast && (
        <div className="fixed top-14 right-4 z-[9999] max-w-sm w-full bg-red-950/95 border border-red-900/50 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-toast-slide">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="data-label text-red-500">CASCADE EXCEPTION ALERT</span>
              <span className="text-[9px] font-mono text-red-400">{activeToast.timestamp}</span>
            </div>
            <p className="text-xs font-bold text-slate-100 mt-1">
              Shipment <span className="font-mono">{activeToast.shipmentId}</span>
            </p>
            <p className="text-[11px] text-red-300 mt-0.5 leading-normal">{activeToast.message}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-red-400 font-bold uppercase font-mono">
              <span>Risk Factor:</span>
              <span className="bg-red-950 border border-red-900/40 text-red-500 rounded px-1.5 py-0.5">
                {activeToast.riskScore}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-500 hover:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-slate-400" />
            Operations Central Command Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live geospatial fleet coordinates telemetry and terminal queue capacities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800/60 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-chip-blink" />
            <span className="font-mono text-[9px] text-slate-400 tracking-wider">SYNC {now}</span>
          </div>
          <button
            onClick={() => { refetchWarehouses(); }}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 bg-slate-900 text-xs text-slate-300 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Force Sync
          </button>
        </div>
      </div>

      {/* ── Main Command Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Visual Map Frame (70% / 2 cols) */}
        <div className="xl:col-span-2 flex flex-col gap-3 bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 h-[560px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Truck className="h-4 w-4 text-slate-400" />
              GEOSPATIAL FLEET COORDINATES TRACKER (70% PANEL)
            </h2>
            {/* Live badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#06090f] border border-slate-800/60 rounded text-[9px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE FLEET · SH-7777
            </div>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-800/60 relative z-10">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {warehouses.map((wh) => (
                <Marker
                  key={wh.warehouseId}
                  position={[wh.coordinates.coordinates[1], wh.coordinates.coordinates[0]]}
                  icon={createDotIcon(wh.currentQueueLength >= 10 ? 'red' : wh.currentQueueLength >= 5 ? 'amber' : 'emerald')}
                >
                  <Popup>
                    <div className="text-[11px] leading-relaxed">
                      <p className="font-bold text-slate-100 text-xs">{wh.name}</p>
                      <p className="text-slate-400 mt-1">ID: <span className="font-mono">{wh.warehouseId}</span></p>
                      <p className="text-slate-400">Queue: <span className="font-mono font-bold text-slate-200">{wh.currentQueueLength} units</span></p>
                      <p className="text-slate-400">Avg Dwell: <span className="font-mono font-semibold text-slate-200">{Math.round(wh.dwellTimeAvg / 60)} mins</span></p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {polylinePositions.length > 0 && (
                <>
                  <Polyline
                    positions={polylinePositions}
                    color="#10b981"
                    weight={1.5}
                    dashArray="5, 9"
                    opacity={0.8}
                  />
                  {journeyLegs.map((leg, idx) => (
                    <Marker
                      key={idx}
                      position={[leg.coordinates.coordinates[1], leg.coordinates.coordinates[0]]}
                      icon={createDotIcon(leg.weatherException ? 'red' : 'emerald')}
                    >
                      <Popup>
                        <div className="text-[11px]">
                          <p className="font-bold text-emerald-500">Leg {idx}: {leg.locationId}</p>
                          <p className="text-slate-400 mt-0.5">Dwell: <span className="font-mono">{leg.dwellDuration ? `${Math.round(leg.dwellDuration / 3600)}h` : 'In Transit'}</span></p>
                          {leg.weatherException && <p className="text-red-500 font-semibold mt-1">⚠ Weather exception logged.</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Right Stack: Alerts + Bottlenecks */}
        <div className="flex flex-col gap-6 h-[560px]">

          {/* Live Delay Anomaly Feed */}
          <div className="flex-1 card-panel p-4 flex flex-col gap-3 overflow-hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/40 pb-2.5 shrink-0">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Live Delay Anomaly Feeds
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 animate-chip-blink" />
            </h2>

            <div className="flex-grow overflow-y-auto flex flex-col gap-2.5 pr-0.5">
              {alerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-600 font-bold uppercase font-mono">No delay anomalies</p>
                  <p className="text-[9px] text-slate-700 font-mono mt-0.5">Telemetry buffer synced</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleOpenRiskModal(alert.shipmentId)}
                    className="bg-red-950/15 border-l-2 border-l-red-500/70 border border-red-900/35 hover:border-red-500/60 rounded-r-xl rounded-bl-xl p-3 flex flex-col gap-1.5 shrink-0 transition-all cursor-pointer animate-fade-slide-in hover:bg-red-950/30"
                    title="Click to view detailed predictive risk breakdown"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-chip-blink" />
                        <span className="text-red-500 text-[9px] font-extrabold uppercase tracking-widest font-mono">
                          {alert.status}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-600">{alert.timestamp}</span>
                    </div>
                    <p className="font-bold text-slate-200 text-[11px]">
                      Shipment: <span className="font-mono text-amber-400">{alert.shipmentId}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] leading-normal">{alert.message}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-900/20 w-max">
                        RISK SCORE: {alert.riskScore}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 underline font-semibold">View Factor Breakdown &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Yard Capacity Bottlenecks */}
          <div className="flex-1 card-panel p-4 flex flex-col gap-3 overflow-hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/40 pb-2.5 shrink-0">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              Yard Capacity Bottlenecks
            </h2>

            <div className="flex-grow overflow-y-auto flex flex-col pr-0.5 divide-y divide-slate-800/40">
              {isLoadingWH ? (
                <div className="py-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                  Querying telemetry...
                </div>
              ) : warehouses.length === 0 ? (
                <div className="py-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                  No warehouses found
                </div>
              ) : (
                warehouses.map((wh) => {
                  const capacityPercent = Math.min(100, Math.round((wh.currentQueueLength / 15) * 100));
                  const color = wh.currentQueueLength >= 10 ? 'bg-red-500' : wh.currentQueueLength >= 5 ? 'bg-amber-500' : 'bg-emerald-500';
                  const textColor = wh.currentQueueLength >= 10 ? 'text-red-500' : wh.currentQueueLength >= 5 ? 'text-amber-500' : 'text-emerald-500';
                  return (
                    <div key={wh.warehouseId} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-300 font-bold">{wh.name}</span>
                        <span className={`font-extrabold ${textColor}`}>{capacityPercent}% CAP</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${color}`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-600 font-mono shrink-0">{wh.currentQueueLength}/15</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Warehouse Operations Matrix ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Inbound Deliveries Queue */}
        <div className="card-panel p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40 pb-2.5 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            Inbound Deliveries Queue
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                  <th className="py-2 px-2">Shipment ID</th>
                  <th className="py-2 px-2">Origin Hub</th>
                  <th className="py-2 px-2">ETA</th>
                  <th className="py-2 px-2 text-right">Delay</th>
                  <th className="py-2 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {inboundShipments.map((ship) => (
                  <tr key={ship.id} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                    <td
                      onClick={() => handleOpenRiskModal(ship.id)}
                      className="py-2.5 px-2 font-mono text-slate-200 font-semibold text-[10px] cursor-pointer hover:text-amber-400 hover:underline"
                    >
                      {ship.id}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{ship.origin}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-300">{ship.eta}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-500">{ship.delay}</td>
                    <td className="py-2.5 px-2 text-right">{renderStatusTag(ship.status, () => handleOpenRiskModal(ship.id))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outbound Dispatch Checklist */}
        <div className="card-panel p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40 pb-2.5 flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-slate-500" />
            Outbound Dispatch Checklist
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                  <th className="py-2 px-2">Shipment ID</th>
                  <th className="py-2 px-2">Destination Hub</th>
                  <th className="py-2 px-2">Dispatch</th>
                  <th className="py-2 px-2">Carrier</th>
                  <th className="py-2 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {outboundShipments.map((ship) => (
                  <tr key={ship.id} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                    <td
                      onClick={() => handleOpenRiskModal(ship.id)}
                      className="py-2.5 px-2 font-mono text-slate-200 font-semibold text-[10px] cursor-pointer hover:text-amber-400 hover:underline"
                    >
                      {ship.id}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{ship.destination}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-300">{ship.departure}</td>
                    <td className="py-2.5 px-2 text-slate-500">{ship.carrier}</td>
                    <td className="py-2.5 px-2 text-right">{renderStatusTag(ship.status, () => handleOpenRiskModal(ship.id))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Cost-Aware Intervention Matrix ─────────────────────────── */}
      <div className="card-panel p-4 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40 pb-2.5">
          Cost-Aware Intervention Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">Shipment ID</th>
                <th className="py-2 px-2">Alternate Route Choice</th>
                <th className="py-2 px-2 text-right">Transit Cost</th>
                <th className="py-2 px-2 text-right">Averted SLA</th>
                <th className="py-2 px-2 text-right text-emerald-500">Net Savings</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((int) => (
                <tr key={int.id} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                  <td className="py-2.5 px-2 font-mono text-slate-500 text-[10px]">{int.id}</td>
                  <td
                    onClick={() => handleOpenRiskModal(int.shipmentId)}
                    className="py-2.5 px-2 font-mono text-slate-200 font-bold text-[10px] cursor-pointer hover:text-amber-400 hover:underline"
                  >
                    {int.shipmentId}
                  </td>
                  <td className="py-2.5 px-2 text-slate-300 font-semibold">{int.route}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-red-400 font-semibold">{int.cost}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-500 font-semibold">{int.avertedPenalties}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-400 font-extrabold">{int.netSaving}</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800/60 text-slate-400 font-bold tracking-widest text-[8px] rounded-md uppercase font-mono">
                      {int.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Industrial Slide-Over Risk Breakdown Drawer */}
      <RiskBreakdownModal
        shipmentId={selectedRiskShipmentId}
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
      />

    </div>
  );
};

export default CommandCenter;
