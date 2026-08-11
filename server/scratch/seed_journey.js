import 'dotenv/config';
import mongoose from 'mongoose';
import ShipmentJourney from '../src/models/ShipmentJourney.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await ShipmentJourney.deleteMany({ shipmentId: 'SH-7777' });
  
  const journey = new ShipmentJourney({
    shipmentId: 'SH-7777',
    origin: 'WH-001',
    destination: 'WH-003',
    status: 'AT_RISK',
    riskScore: 65,
    currentEta: new Date(Date.now() + 7200000),
    legs: [
      {
        sequenceIndex: 0,
        locationId: 'HUB-MADURAI',
        timestamp: new Date(Date.now() - 3600000),
        coordinates: { type: 'Point', coordinates: [78.1198, 9.9252] }, // Madurai
        dwellDuration: 3600,
        weatherException: false,
      },
      {
        sequenceIndex: 1,
        locationId: 'HUB-CHENNAI',
        timestamp: new Date(),
        coordinates: { type: 'Point', coordinates: [80.2707, 13.0827] }, // Chennai
        dwellDuration: 7200,
        weatherException: true,
      }
    ],
  });
  
  await journey.save();
  console.log("Successfully seeded SH-7777 journey into DB.");
  process.exit(0);
}
seed().catch(console.error);
