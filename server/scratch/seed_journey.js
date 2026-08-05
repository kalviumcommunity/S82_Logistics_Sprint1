import 'dotenv/config';
import mongoose from 'mongoose';
import ShipmentJourney from '../src/models/ShipmentJourney.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  await ShipmentJourney.deleteMany({ shipmentId: 'SH-7777' });

  await ShipmentJourney.create({
    shipmentId: 'SH-7777',
    status: 'AT_RISK',
    riskScore: 45,
    currentEta: new Date(Date.now() + 86400000), // +24 hours
    legs: [
      {
        sequenceIndex: 0,
        locationId: 'WH-001',
        coordinates: { type: 'Point', coordinates: [-74.006, 40.7128] },
        timestamp: new Date('2026-07-13T10:00:00.000Z'),
        dwellDuration: 14400,
        weatherException: false
      },
      {
        sequenceIndex: 1,
        locationId: 'WH-002',
        coordinates: { type: 'Point', coordinates: [-87.6298, 41.8781] },
        timestamp: new Date('2026-07-13T14:00:00.000Z'),
        dwellDuration: 21600,
        weatherException: true
      },
      {
        sequenceIndex: 2,
        locationId: 'WH-003',
        coordinates: { type: 'Point', coordinates: [-118.2437, 34.0522] },
        timestamp: new Date('2026-07-13T20:00:00.000Z'),
        dwellDuration: 0,
        weatherException: false
      }
    ]
  });

  console.log('Seeded ShipmentJourney SH-7777');
  process.exit(0);
}

seed().catch(console.error);
