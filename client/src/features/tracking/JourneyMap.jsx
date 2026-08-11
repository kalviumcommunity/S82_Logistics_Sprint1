import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom div icons
const createHubIcon = (isDelayed) => L.divIcon({
  className: 'custom-hub-marker bg-transparent',
  html: `<div class="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 border-2 border-slate-600 shadow-md text-[12px] opacity-90 hover:opacity-100 transition-opacity">🏢</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createStartIcon = () => L.divIcon({
  className: 'custom-start-marker bg-transparent',
  html: `<div class="relative flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 border-2 border-white shadow-lg text-[14px]">🏁</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const createExceptionIcon = () => L.divIcon({
  className: 'custom-exception-marker bg-transparent',
  html: `<div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-red-600 border-2 border-red-900 shadow-lg text-white font-bold text-[10px]">⚠️</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createCurrentIcon = (status) => {
  const colorClass = status === 'DELAYED' ? 'bg-red-600' : status === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-600';
  const pulseClass = status === 'DELAYED' ? 'bg-red-500/30' : status === 'AT_RISK' ? 'bg-amber-500/30' : 'bg-sky-500/30';
  
  return L.divIcon({
    className: 'custom-current-marker bg-transparent',
    html: `
      <div class="relative flex h-8 w-8 items-center justify-center rounded-full ${colorClass} border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-[1000]">
        <span class="absolute inline-flex h-12 w-12 rounded-full animate-ping ${pulseClass}"></span>
        <span class="text-[16px]">🚚</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const MapBoundsUpdater = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
};

const JourneyMap = ({ legs, currentStatus, alternateRoutes = [] }) => {
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [altGeometries, setAltGeometries] = useState({});

  useEffect(() => {
    if (!legs || legs.length === 0) return;

    if (legs.length >= 2) {
      // Build coordinate string: lon,lat;lon,lat
      const coordString = legs.map(leg => `${leg.coordinates.coordinates[0]},${leg.coordinates.coordinates[1]}`).join(';');
      
      fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const mappedPositions = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteGeometry(mappedPositions);
          }
        })
        .catch(err => console.error('Failed to fetch OSRM route:', err));
    }

    // Fetch for alternate routes
    if (alternateRoutes.length > 0) {
      alternateRoutes.forEach((route, i) => {
        if (!route.targetCoordinates) return;
        const currentLeg = legs[legs.length - 1];
        const coordString = `${currentLeg.coordinates.coordinates[0]},${currentLeg.coordinates.coordinates[1]};${route.targetCoordinates[0]},${route.targetCoordinates[1]}`;
        
        fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes.length > 0) {
              const mappedPositions = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
              setAltGeometries(prev => ({ ...prev, [i]: mappedPositions }));
            }
          })
          .catch(err => console.error('Failed to fetch OSRM alt route:', err));
      });
    }
  }, [legs, alternateRoutes]);

  if (!legs || legs.length === 0) return null;

  // Extract lat, lng (GeoJSON format is [lng, lat])
  const positions = legs.map(leg => [
    leg.coordinates.coordinates[1],
    leg.coordinates.coordinates[0]
  ]);

  const allPositions = [...positions];
  alternateRoutes.forEach(route => {
    if (route.targetCoordinates) {
      allPositions.push([route.targetCoordinates[1], route.targetCoordinates[0]]);
    }
  });

  const pathColor = currentStatus === 'DELAYED' ? '#ef4444' : currentStatus === 'AT_RISK' ? '#f59e0b' : '#10b981';

  return (
    <div className="w-full h-[350px] md:h-[450px] rounded-lg border border-slate-800/60 overflow-hidden relative z-0 mb-6 bg-[#090d16]">
      <MapContainer 
        center={positions[0]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#e5e5e5', zIndex: 1 }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {routeGeometry ? (
          <Polyline 
            positions={routeGeometry} 
            pathOptions={{ color: pathColor, weight: 4, opacity: 0.8 }} 
          />
        ) : (
          <Polyline 
            positions={positions} 
            pathOptions={{ color: pathColor, weight: 3, dashArray: '5, 10', className: 'animate-trajectory-flow' }} 
          />
        )}

        {legs.map((leg, index) => {
          const isLast = index === legs.length - 1;
          const pos = [leg.coordinates.coordinates[1], leg.coordinates.coordinates[0]];
          const isException = leg.weatherException || (currentStatus === 'DELAYED' && index > 0);
          
          return (
            <Marker 
              key={index} 
              position={pos} 
              icon={
                isLast ? createCurrentIcon(currentStatus) 
                : index === 0 ? createStartIcon() 
                : isException ? createExceptionIcon() 
                : createHubIcon(false)
              }
            >
              <Popup className="custom-popup border-0">
                <div className="flex flex-col gap-1 p-1">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {index === 0 ? 'Start Hub' : isLast ? 'Current Location' : `Hub Leg ${index}`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Location ID: {leg.locationId}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {new Date(leg.timestamp).toLocaleString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {alternateRoutes.map((route, i) => {
          if (!route.targetCoordinates) return null;
          const altPos = [route.targetCoordinates[1], route.targetCoordinates[0]];
          const altColor = route.candidateRiskScore < 50 ? '#10b981' : route.candidateRiskScore < 70 ? '#f59e0b' : '#ef4444';
          const currentPos = positions[positions.length - 1];
          const polylinePositions = altGeometries[i] ? altGeometries[i] : [currentPos, altPos];

          return (
            <Polyline
              key={`alt-${i}`}
              positions={polylinePositions}
              pathOptions={{ color: altColor, weight: 2, dashArray: '4, 8', opacity: 0.8 }}
            >
              <Tooltip sticky className="custom-tooltip bg-slate-900 border border-slate-700 text-slate-200">
                <div className="font-mono text-xs">
                  <div className="font-bold text-white mb-1">{route.routeName}</div>
                  <div className={route.netSavings > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                    Net Savings: ₹{route.netSavings}
                  </div>
                  <div className="text-slate-400">
                    Saves: {route.slaPenaltiesSaved ? Math.round(route.slaPenaltiesSaved/15) : 0} mins
                  </div>
                  <div className="text-slate-400">
                    Risk Score: {route.candidateRiskScore}
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        <MapBoundsUpdater positions={allPositions} />
      </MapContainer>
      
      {/* Live Telemetry Panel Overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 border border-slate-700 backdrop-blur rounded-lg p-3 w-64 shadow-2xl pointer-events-none">
        <h4 className="text-[11px] font-bold text-slate-200 mb-2 font-mono flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${currentStatus === 'SAFE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          LIVE TELEMETRY / ALERTS
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {legs.map((leg, idx) => {
            if (leg.weatherException || (currentStatus === 'DELAYED' && idx === legs.length - 1)) {
              return (
                <div key={idx} className="bg-red-950/30 border border-red-900/50 p-2 rounded text-[10px] text-slate-300 font-mono">
                  <span className="text-red-400 font-bold block mb-0.5">⚠️ ALERT @ {leg.locationId}</span>
                  Severe highway congestion reported. Expected delay: 4 hours. Road partially blocked.
                </div>
              );
            }
            return null;
          })}
          {currentStatus === 'SAFE' && !legs.some(l => l.weatherException) && (
            <div className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded text-[10px] text-emerald-400 font-mono">
              ✓ All routes clear. No active blocks or weather warnings along path.
            </div>
          )}
        </div>
      </div>

      {/* Map Legend Panel */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/95 border border-slate-700 backdrop-blur rounded-lg p-3 w-56 shadow-2xl pointer-events-none">
        <h4 className="text-[11px] font-bold text-slate-200 mb-2 font-mono border-b border-slate-800 pb-1">
          MAP LEGEND
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span className="text-[14px]">🚚</span> Active Truck Location
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span className="text-[14px]">🏢</span> Transfer Hub / Warehouse
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span className="text-[14px]">🏁</span> Origin / Start Point
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span className="text-[14px]">⚠️</span> Blocked / Delayed Area
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono mt-2 border-t border-slate-800 pt-1.5">
            <span className="w-8 h-1 rounded-full bg-emerald-500 block"></span> Clear Route
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span className="w-8 h-1 rounded-full bg-red-500 block"></span> Delayed Route
          </div>
        </div>
      </div>

      {/* Subtle overlay shadow to blend edges into the dark theme */}
      <div className="absolute inset-0 pointer-events-none border border-slate-800/60 rounded-lg shadow-[inset_0_0_15px_rgba(9,13,22,1)] z-10" />
    </div>
  );
};

export default JourneyMap;
