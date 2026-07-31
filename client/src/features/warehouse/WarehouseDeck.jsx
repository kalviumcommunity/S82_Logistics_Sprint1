import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import {
  Warehouse, ArrowDownRight, ArrowUpRight, Clock, CheckCircle2,
  AlertTriangle, Truck, Layers, Filter, X, ShieldAlert, Zap, Box
} from 'lucide-react';

const MOCK_INBOUND = [
  {
    id: 'LGS-8842-XT9',
    origin: 'Chicago Central Hub (CHI-01)',
    eta: '14:32:10 UTC',
    dwellTime: '42m',
    units: 140,
    priority: 'HIGH',
    status: 'IN_TRANSIT',
    gate: 'GATE-04',
    hazmat: false,
    checklist: [
      { id: 'c1', label: 'Verify Seal #SL-8849-B', done: true },
      { id: 'c2', label: 'Scan RFID Pallet Tags (140 units)', done: true },
      { id: 'c3', label: 'Perform Temperature Log Audit', done: false },
      { id: 'c4', label: 'Stage for Rapid Offload Bay 3', done: false },
    ],
  },
  {
    id: 'LGS-1024-CH4',
    origin: 'Detroit Distribution Depot (DET-02)',
    eta: '15:45:00 UTC',
    dwellTime: '12m',
    units: 85,
    priority: 'NORMAL',
    status: 'SCHEDULED',
    gate: 'GATE-02',
    hazmat: false,
    checklist: [
      { id: 'c1', label: 'Verify Manifest Certificate', done: true },
      { id: 'c2', label: 'Scan RFID Pallet Tags (85 units)', done: false },
      { id: 'c3', label: 'Cross-dock Transfer to Bay 1', done: false },
    ],
  },
  {
    id: 'LGS-7777-NY1',
    origin: 'New York East Port Terminal (NY-05)',
    eta: '16:15:32 UTC',
    dwellTime: '1h 15m',
    units: 220,
    priority: 'CRITICAL',
    status: 'DELAYED',
    gate: 'GATE-09',
    hazmat: true,
    checklist: [
      { id: 'c1', label: 'Hazmat Class 3 Clearance Check', done: true },
      { id: 'c2', label: 'Verify Seal #SL-9912-X', done: true },
      { id: 'c3', label: 'Priority Offload & Hazmat Storage', done: false },
      { id: 'c4', label: 'Alert Operations Coordinator', done: true },
    ],
  },
  {
    id: 'LGS-9051-LA3',
    origin: 'Los Angeles Gateway Yard (LAX-03)',
    eta: '17:00:15 UTC',
    dwellTime: '0m',
    units: 310,
    priority: 'NORMAL',
    status: 'IN_TRANSIT',
    gate: 'GATE-01',
    hazmat: false,
    checklist: [
      { id: 'c1', label: 'Verify Container BOL', done: true },
      { id: 'c2', label: 'Inspect Exterior Fasteners', done: false },
      { id: 'c3', label: 'Scan RFID Pallet Tags (310 units)', done: false },
    ],
  },
  {
    id: 'LGS-4112-TX7',
    origin: 'Houston South Logistics Yard (HOU-01)',
    eta: '18:30:00 UTC',
    dwellTime: '55m',
    units: 175,
    priority: 'HIGH',
    status: 'DELAYED',
    gate: 'GATE-07',
    hazmat: false,
    checklist: [
      { id: 'c1', label: 'Log Arrival Delay Exception', done: true },
      { id: 'c2', label: 'Verify Seal #SL-3301-A', done: false },
      { id: 'c3', label: 'Fast-Track Offload to Queue B', done: false },
    ],
  },
];

const MOCK_OUTBOUND = [
  {
    id: 'LGS-2041-TR5',
    destination: 'Dallas Central Logistics Terminal (DAL-01)',
    departure: '14:50:00 UTC',
    carrier: 'FedEx Freight Direct',
    trailer: 'TR-9041',
    dock: 'BAY-12',
    status: 'LOADING',
    loadProgress: 85,
  },
  {
    id: 'LGS-3392-PL1',
    destination: 'Seattle North Distribution Yard (SEA-04)',
    departure: '15:30:00 UTC',
    carrier: 'DHL Express Air Express',
    trailer: 'TR-1182',
    dock: 'BAY-08',
    status: 'READY',
    loadProgress: 100,
  },
  {
    id: 'LGS-5582-QW9',
    destination: 'Miami South Hub Terminal (MIA-02)',
    departure: '16:45:00 UTC',
    carrier: 'UPS Ground Regional',
    trailer: 'TR-4402',
    dock: 'BAY-05',
    status: 'STAGED',
    loadProgress: 40,
  },
  {
    id: 'LGS-8810-AZ2',
    destination: 'Phoenix West Hub Facility (PHX-01)',
    departure: '18:10:00 UTC',
    carrier: 'Swift Transport Logistics',
    trailer: 'TR-7719',
    dock: 'BAY-03',
    status: 'DELAYED',
    loadProgress: 15,
  },
];

export const WarehouseDeck = () => {
  const { apiClient } = useApi();

  const [inboundList, setInboundList] = useState(MOCK_INBOUND);
  const [outboundList] = useState(MOCK_OUTBOUND);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  // Fetch facility capacity telemetry
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouse-facilities'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses').catch(() => null);
      return res?.data || null;
    },
    refetchInterval: 10000,
  });

  const handleRowClick = (shipment) => {
    setSelectedShipment(shipment);
    setDrawerOpen(true);
  };

  const handlePrioritizeOffload = (shipmentId) => {
    // Elevate priority locally
    setInboundList((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, priority: 'CRITICAL', status: 'PRIORITIZED' } : s))
    );
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment((prev) => ({ ...prev, priority: 'CRITICAL', status: 'PRIORITIZED' }));
    }
    showToast(`OFFLOAD PRIORITIZED: ${shipmentId} moved to Top Ingest Queue in Redis`);
  };

  const toggleChecklistItem = (itemLabel) => {
    if (!selectedShipment) return;
    const updatedChecklist = selectedShipment.checklist.map((item) =>
      item.label === itemLabel ? { ...item, done: !item.done } : item
    );
    setSelectedShipment({ ...selectedShipment, checklist: updatedChecklist });
    setInboundList((prev) =>
      prev.map((s) => (s.id === selectedShipment.id ? { ...s, checklist: updatedChecklist } : s))
    );
  };

  const showToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4000);
  };

  return (
    <div className="p-6 w-full flex flex-col gap-6 max-w-7xl mx-auto font-sans bg-[#06090f] text-slate-100 min-h-screen">
      
      {/* Action Toast Notification */}
      {actionToast && (
        <div className="fixed top-16 right-6 z-[999] max-w-md w-full bg-[#0d1321] border border-emerald-500/50 rounded-lg p-3.5 shadow-2xl flex items-start gap-3 animate-toast-slide backdrop-blur-md">
          <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">
              FACILITY ENGINE ACTION EXECUTED
            </span>
            <p className="font-mono text-xs text-slate-200 mt-1">{actionToast}</p>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-500 hover:text-slate-300 text-xs">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0d1321] border border-slate-800/60 rounded-lg">
            <Warehouse className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-100 uppercase font-sans">
              Warehouse &amp; Terminal Operations Matrix
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              REAL-TIME INBOUND UNLOAD QUEUE · OUTBOUND DISPATCH MATRIX · YARD CAPACITY
            </p>
          </div>
        </div>

        {/* Live Facility Telemetry Badges */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#0d1321] px-3 py-1.5 border border-slate-800/60 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-chip-blink" />
            <span className="font-mono text-[10px] text-emerald-400 font-bold tracking-wider">
              FACILITY: WH-CHICAGO-01
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0d1321] px-3 py-1.5 border border-slate-800/60 rounded-lg">
            <span className="font-mono text-[10px] text-slate-400">YARD OCCUPANCY: 78%</span>
          </div>
        </div>
      </div>

      {/* ── Top Metric Summary Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              INBOUND QUEUE
            </span>
            <ArrowDownRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-slate-100">{inboundList.length} UNITS</p>
            <p className="font-mono text-[10px] text-emerald-400 mt-0.5">2 Critical Offload Requests</p>
          </div>
        </div>

        <div className="bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              OUTBOUND DISPATCH
            </span>
            <ArrowUpRight className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-slate-100">{outboundList.length} CARRIERS</p>
            <p className="font-mono text-[10px] text-slate-400 mt-0.5">Next departure in 18m</p>
          </div>
        </div>

        <div className="bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              AVG DWELL TIME
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-slate-100">42m 15s</p>
            <p className="font-mono text-[10px] text-amber-400 mt-0.5">-8% vs baseline target</p>
          </div>
        </div>

        <div className="bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              ACTIVE DOCK GATES
            </span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-slate-100">12 / 16</p>
            <p className="font-mono text-[10px] text-purple-400 mt-0.5">4 gates available</p>
          </div>
        </div>
      </div>

      {/* ── Main Data Tables Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Inbound Unload Queue */}
        <div className="bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-sans">
                Inbound Delivery Queue
              </h2>
            </div>
            <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
              CLICK ROW FOR MANIFEST
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Shipment Serial</th>
                  <th className="py-2.5 px-3">Origin Hub</th>
                  <th className="py-2.5 px-3">Schedule / ETA</th>
                  <th className="py-2.5 px-3 text-center">Gate</th>
                  <th className="py-2.5 px-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-xs">
                {inboundList.map((ship) => (
                  <tr
                    key={ship.id}
                    onClick={() => handleRowClick(ship)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {ship.id}
                        </span>
                        {ship.hazmat && (
                          <span className="text-[8px] font-bold text-red-400 bg-red-950/60 border border-red-900/60 px-1 py-0.2 rounded">
                            HAZMAT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-sans truncate max-w-[160px]">
                      {ship.origin}
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px]">
                      {ship.eta}
                    </td>
                    <td className="py-3 px-3 text-center text-[10px] text-slate-400 font-bold">
                      {ship.gate}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${
                        ship.priority === 'CRITICAL' ? 'bg-red-950/40 text-red-400 border-red-900/50' :
                        ship.priority === 'HIGH'     ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' :
                                                       'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                      }`}>
                        {ship.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outbound Dispatch Matrix */}
        <div className="bg-[#0d1321] border border-slate-800/60 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-sky-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-sans">
                Outbound Dispatch Checklist
              </h2>
            </div>
            <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
              4 ACTIVE CARRIERS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Shipment Serial</th>
                  <th className="py-2.5 px-3">Destination Facility</th>
                  <th className="py-2.5 px-3">Departure</th>
                  <th className="py-2.5 px-3">Carrier / Trailer</th>
                  <th className="py-2.5 px-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-xs">
                {outboundList.map((ship) => (
                  <tr key={ship.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-100">
                      {ship.id}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-sans truncate max-w-[160px]">
                      {ship.destination}
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px]">
                      {ship.departure}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">
                      <div>{ship.carrier}</div>
                      <div className="text-[9px] font-mono text-slate-500">{ship.trailer} · {ship.dock}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-slate-300">{ship.loadProgress}%</span>
                        <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                          <div
                            className={`h-full rounded-full ${
                              ship.loadProgress === 100 ? 'bg-emerald-500' :
                              ship.loadProgress > 50    ? 'bg-sky-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${ship.loadProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Slide-Over Manifest Checklist Drawer ─────────────────────── */}
      {drawerOpen && selectedShipment && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[400] transition-opacity"
          />

          {/* Drawer Container */}
          <div
            className="fixed inset-y-0 right-0 z-[500] w-full max-w-lg bg-[#0d1321] border-l border-slate-800/60 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-left"
          >
            {/* Drawer Header */}
            <div className="flex flex-col gap-4 border-b border-slate-800/60 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-widest">
                    MANIFEST CHECKLIST &amp; OFFLOAD SPECS
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-100 font-mono">
                  {selectedShipment.id}
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Origin: <strong className="text-slate-200">{selectedShipment.origin}</strong>
                </p>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800/60 font-mono text-[10px]">
                <div>
                  <span className="text-slate-500 uppercase block">PRIORITY</span>
                  <span className="font-bold text-emerald-400">{selectedShipment.priority}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">UNITS</span>
                  <span className="font-bold text-slate-200">{selectedShipment.units} Pallets</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">SCHEDULED GATE</span>
                  <span className="font-bold text-sky-400">{selectedShipment.gate}</span>
                </div>
              </div>
            </div>

            {/* Checklist Section */}
            <div className="flex-1 py-6 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Offload Handling Checklist</span>
                <span className="text-[10px] text-slate-500">
                  {selectedShipment.checklist.filter((c) => c.done).length} / {selectedShipment.checklist.length} Completed
                </span>
              </h3>

              <div className="flex flex-col gap-2.5">
                {selectedShipment.checklist.map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.label)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                      item.done
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
                        : 'bg-slate-950 border-slate-800/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-xs font-sans ${item.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="border-t border-slate-800/60 pt-5 flex flex-col gap-3">
              <button
                onClick={() => handlePrioritizeOffload(selectedShipment.id)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>PRIORITIZE OFFLOAD (QUEUE TOP INGEST)</span>
              </button>
              <p className="text-[9px] font-mono text-slate-500 text-center uppercase">
                Fires Redis Stream queue re-ordering &amp; alerts terminal yard supervisor.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default WarehouseDeck;
