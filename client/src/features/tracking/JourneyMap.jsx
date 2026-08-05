import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
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
  html: `<div class="h-3 w-3 rounded-full border-2 border-[#090d16] ${isDelayed ? 'bg-red-500' : 'bg-slate-500'}"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const createCurrentIcon = (status) => {
  const colorClass = status === 'DELAYED' ? 'bg-red-500' : status === 'AT_RISK' ? 'bg-amber-500' : 'bg-emerald-500';
  const pulseClass = status === 'DELAYED' ? 'bg-red-500/20' : status === 'AT_RISK' ? 'bg-amber-500/20' : 'bg-sky-500/20';
  
  return L.divIcon({
    className: 'custom-current-marker bg-transparent',
    html: `
      <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#090d16] border border-slate-850 shadow-lg">
        <span class="absolute inline-flex h-5 w-5 rounded-full animate-pulse-ring ${pulseClass}"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${colorClass}"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
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

const JourneyMap = ({ legs, currentStatus }) => {
  if (!legs || legs.length === 0) return null;

  // Extract lat, lng (GeoJSON format is [lng, lat])
  const positions = legs.map(leg => [
    leg.coordinates.coordinates[1],
    leg.coordinates.coordinates[0]
  ]);

  const pathColor = currentStatus === 'DELAYED' ? '#ef4444' : currentStatus === 'AT_RISK' ? '#f59e0b' : '#10b981';

  return (
    <div className="w-full h-[350px] md:h-[450px] rounded-lg border border-slate-800/60 overflow-hidden relative z-0 mb-6 bg-[#090d16]">
      <MapContainer 
        center={positions[0]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#090d16', zIndex: 1 }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <Polyline 
          positions={positions} 
          pathOptions={{ color: pathColor, weight: 3, dashArray: '5, 10', className: 'animate-trajectory-flow' }} 
        />

        {legs.map((leg, index) => {
          const isLast = index === legs.length - 1;
          const pos = [leg.coordinates.coordinates[1], leg.coordinates.coordinates[0]];
          const isException = leg.weatherException || (currentStatus === 'DELAYED' && index > 0);
          
          return (
            <Marker 
              key={index} 
              position={pos} 
              icon={isLast ? createCurrentIcon(currentStatus) : createHubIcon(isException)}
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

        <MapBoundsUpdater positions={positions} />
      </MapContainer>
      
      {/* Subtle overlay shadow to blend edges into the dark theme */}
      <div className="absolute inset-0 pointer-events-none border border-slate-800/60 rounded-lg shadow-[inset_0_0_15px_rgba(9,13,22,1)] z-10" />
    </div>
  );
};

export default JourneyMap;
