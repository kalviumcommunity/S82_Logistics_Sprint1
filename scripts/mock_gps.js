const API_URL = 'http://127.0.0.1:3005/api/v1/telemetry/ping';

// Starting coordinates for Madurai
let currentLat = 9.9252;
let currentLng = 78.1198;

const trackingId = 'SH-1025';

// Calculate small increments for a slow move towards Chennai (approx 13.0827, 80.2707)
const latIncrement = (13.0827 - 9.9252) / 20; 
const lngIncrement = (80.2707 - 78.1198) / 20;

let step = 0;

async function sendPing() {
  currentLat += latIncrement;
  currentLng += lngIncrement;
  
  // Simulate a storm halfway through
  const isStorming = step > 8 && step < 12;

  const payload = {
    trackingId,
    lat: currentLat,
    lng: currentLng,
    locationId: `HIGHWAY-WP-${step}`,
    weatherException: isStorming,
    dwellDuration: isStorming ? 3600 : 0
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`[${new Date().toISOString()}] Pinged ${trackingId} -> Lat: ${currentLat.toFixed(4)}, Lng: ${currentLng.toFixed(4)} | Storm: ${isStorming} | Status: ${data.status}`);
  } catch (err) {
    console.error(`Failed to ping:`, err.message);
  }

  step++;
  if (step < 20) {
    setTimeout(sendPing, 3000); // Ping every 3 seconds for demo purposes
  } else {
    console.log('GPS simulation complete.');
  }
}

console.log(`Starting Live GPS Simulation for ${trackingId}...`);
sendPing();
