import 'dotenv/config';
import mongoose from 'mongoose';
import Warehouse from '../src/models/Warehouse.js';
import ShipmentEvent from '../src/models/ShipmentEvent.js';
import ShipmentJourney from '../src/models/ShipmentJourney.js';
import logger from '../src/config/logger.js';

const MONGODB_URI = process.env.MONGODB_URI;
const GATEWAY_URL = 'http://localhost:3000/api/v1';

async function seedData() {
  logger.info('Connecting to MongoDB for seeding...');
  await mongoose.connect(MONGODB_URI);

  // Clear previous test collections
  await Warehouse.deleteMany({});
  await ShipmentEvent.deleteMany({});
  await ShipmentJourney.deleteMany({});
  logger.info('Cleaned existing Warehouse, ShipmentEvent, and ShipmentJourney collections.');

  // Seed Warehouses
  const warehouses = [
    {
      warehouseId: 'WH-001',
      name: 'New York Logistics Hub',
      coordinates: { type: 'Point', coordinates: [-74.006, 40.7128] },
      currentQueueLength: 2,
      dwellTimeAvg: 1800, // 30 mins
    },
    {
      warehouseId: 'WH-002',
      name: 'Chicago Transit Center (Congested)',
      coordinates: { type: 'Point', coordinates: [-87.6298, 41.8781] },
      currentQueueLength: 12, // High queue length
      dwellTimeAvg: 7200, // High dwell time average (2 hours)
    },
    {
      warehouseId: 'WH-003',
      name: 'Los Angeles Distribution Port',
      coordinates: { type: 'Point', coordinates: [-118.2437, 34.0522] },
      currentQueueLength: 1,
      dwellTimeAvg: 900, // 15 mins
    },
  ];

  await Warehouse.insertMany(warehouses);
  logger.info('Seeded test warehouses successfully.');
  
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB.');
}

async function sendEvent(event) {
  const response = await fetch(`${GATEWAY_URL}/shipment-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  const body = await response.json();
  logger.info(`Post event status: ${response.status}. Response: ${JSON.stringify(body)}`);
  return { status: response.status, body };
}

async function getJourney(shipmentId) {
  const start = Date.now();
  const response = await fetch(`${GATEWAY_URL}/shipments/${shipmentId}/journey`);
  const elapsed = Date.now() - start;
  const source = response.headers.get('source') || response.headers.get('x-source');
  const body = await response.json();
  logger.info(`Get journey source: ${source} (${elapsed}ms). Status: ${response.status}`);
  return { status: response.status, source, body };
}

async function runTests() {
  logger.info('--- STARTING CASCADING LOGISTICS API INTEGRATION TESTS ---');

  // 1. Seed Database
  await seedData();

  // 2. Ingest Shipment events
  // We will ingest events for shipment "SH-7777"
  // To test out-of-order sorting recovery, we will ingest Event 3 *before* Event 2!
  const event1 = {
    shipmentId: 'SH-7777',
    eventType: 'PICKUP',
    locationId: 'WH-001',
    latitude: 40.7128,
    longitude: -74.006,
    timestamp: '2026-07-13T10:00:00.000Z',
    metadata: { slaHours: 24 }
  };

  const event3 = {
    shipmentId: 'SH-7777',
    eventType: 'DELIVERED',
    locationId: 'WH-003',
    latitude: 34.0522,
    longitude: -118.2437,
    timestamp: '2026-07-13T20:00:00.000Z',
    metadata: { slaHours: 24 }
  };

  const event2 = {
    shipmentId: 'SH-7777',
    eventType: 'IN_TRANSIT',
    locationId: 'WH-002',
    latitude: 41.8781,
    longitude: -87.6298,
    timestamp: '2026-07-13T14:00:00.000Z',
    metadata: { weatherException: true, slaHours: 24 } // Has weatherException tag!
  };

  logger.info('Ingesting Event 1 (10:00 AM)...');
  await sendEvent(event1);

  logger.info('Ingesting Event 3 (08:00 PM) - OUT OF ORDER BURST...');
  await sendEvent(event3);

  logger.info('Ingesting Event 2 (02:00 PM) - FILLING CHRONOLOGICAL GAP...');
  await sendEvent(event2);

  logger.info('Waiting 3 seconds for BullMQ worker processing to compile shipment journey...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Test Retrieval Gateway and Cache-Aside (GET)
  logger.info('Retrieving journey (Request 1 - Expect database query)...');
  const res1 = await getJourney('SH-7777');
  if (res1.source !== 'database') {
    logger.error(`Expected source "database", but got "${res1.source}"`);
  }

  logger.info('Retrieving journey (Request 2 - Expect Redis cache hit)...');
  const res2 = await getJourney('SH-7777');
  if (res2.source !== 'cache') {
    logger.error(`Expected source "cache", but got "${res2.source}"`);
  }

  // 4. Validate Sorting and Rebuilding
  const journey = res2.body.data;
  logger.info('Reconstructed Journey Legs sequence:');
  journey.legs.forEach((leg, index) => {
    logger.info(`  Leg [${index}] -> Location: ${leg.locationId}, Time: ${leg.timestamp}, Dwell: ${leg.dwellDuration}s, Weather Exception: ${leg.weatherException}`);
  });

  // Verify chronology
  const orderCorrect = 
    journey.legs[0].locationId === 'WH-001' && 
    journey.legs[1].locationId === 'WH-002' && 
    journey.legs[2].locationId === 'WH-003';

  if (orderCorrect) {
    logger.info('SUCCESS: Chronological event sorting verified. Out-of-order pings recovered correctly.');
  } else {
    logger.error('FAILURE: Chronological event sorting failed!');
  }

  // Verify dwell calculations
  // Leg 0 to Leg 1: 10:00 to 14:00 = 4 hours = 14400 seconds
  // Leg 1 to Leg 2: 14:00 to 20:00 = 6 hours = 21600 seconds
  const dwell0 = journey.legs[0].dwellDuration;
  const dwell1 = journey.legs[1].dwellDuration;
  logger.info(`Dwell Calculations - Leg 0: ${dwell0}s (Expected: 14400s), Leg 1: ${dwell1}s (Expected: 21600s)`);

  // Verify risk metrics
  logger.info(`Dynamic Risk Evaluation - Score: ${journey.riskScore}, Status: ${journey.status}`);
  
  if (journey.riskScore > 0) {
    logger.info('SUCCESS: Risk evaluation logic successfully computed dynamic risk score > 0.');
  } else {
    logger.error('FAILURE: Risk score is 0. Expected risk score calculation.');
  }

  logger.info('--- INTEGRATION TESTS COMPLETED ---');
}

runTests().catch(e => logger.error(e));
