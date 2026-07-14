import { Worker } from 'bullmq';
import { redisQueueConnection, redisClient } from '../config/redis.js';
import ShipmentEvent from '../models/ShipmentEvent.js';
import ShipmentJourney from '../models/ShipmentJourney.js';
import Warehouse from '../models/Warehouse.js';
import { broadcast } from '../config/socket.js';
import logger from '../config/logger.js';

/**
 * Mathematical evaluation of shipment risk score and delivery status
 * Calculates score from 0-100 based on:
 * - Current warehouse queue length
 * - Current warehouse average dwell time
 * - Historical weather exceptions across the journey legs
 * - SLA threshold violation (estimated ETA vs target deadline)
 */
async function evaluateRiskAndEta(legs, currentLegEvent) {
  // 1. Fetch current warehouse information if available
  const warehouse = await Warehouse.findOne({ warehouseId: currentLegEvent.locationId });
  
  // 2. Risk metrics calculation
  let queueRisk = 0;
  let dwellRisk = 0;
  let currentWarehouseDwell = 0;

  if (warehouse) {
    // Up to 40 risk points: 4 points per shipment in queue
    queueRisk = Math.min(warehouse.currentQueueLength * 4, 40);
    // Up to 20 risk points: 2 points per hour of average dwell time
    dwellRisk = Math.min((warehouse.dwellTimeAvg / 3600) * 2, 20);
    currentWarehouseDwell = warehouse.dwellTimeAvg; // in seconds
  }

  // 3. Weather risk metrics (20 points if any leg registered a weather exception)
  const weatherRisk = legs.some(leg => leg.weatherException) ? 20 : 0;

  // 4. SLA timelines check
  // Default Target SLA is 24 hours from the start of the journey, or defined in metadata
  const firstLegTimestamp = legs[0].timestamp;
  const slaHours = currentLegEvent.metadata?.slaHours || 24;
  const targetDeadline = new Date(firstLegTimestamp.getTime() + slaHours * 60 * 60 * 1000);

  // Dynamic ETA estimation: Last event timestamp + remaining transit hours (default 12h) + warehouse congestion
  const remainingTransitTime = 12 * 60 * 60 * 1000; // 12 hours
  const expectedEta = new Date(
    currentLegEvent.timestamp.getTime() + 
    (currentWarehouseDwell * 1000) + 
    remainingTransitTime
  );

  // SLA violation risk (Up to 20 points: 2 points per hour past target deadline)
  let slaRisk = 0;
  if (expectedEta > targetDeadline) {
    const hoursOver = (expectedEta.getTime() - targetDeadline.getTime()) / (3600 * 1000);
    slaRisk = Math.min(hoursOver * 2, 20);
  }

  // Combine and round
  const riskScore = Math.min(100, Math.max(0, Math.round(queueRisk + dwellRisk + weatherRisk + slaRisk)));

  // Determine status classification
  let status = 'SAFE';
  if (expectedEta > targetDeadline || riskScore >= 70) {
    status = 'DELAYED';
  } else if (riskScore >= 35) {
    status = 'AT_RISK';
  }

  return {
    riskScore,
    status,
    currentEta: expectedEta,
  };
}

// Instantiate BullMQ Worker
export const journeyWorker = new Worker(
  'shipment-events',
  async (job) => {
    const { event: rawEvent } = job.data;
    const { shipmentId, eventType, locationId, latitude, longitude, timestamp, metadata } = rawEvent;

    logger.info({ shipmentId, jobName: job.name }, 'Processing shipment event job...');

    try {
      // 1. Append the raw event packet as an immutable log inside MongoDB
      const eventDoc = new ShipmentEvent({
        shipmentId,
        eventType,
        locationId,
        timestamp: new Date(timestamp),
        coordinates: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON order: longitude, latitude
        },
        metadata: metadata || {},
      });
      await eventDoc.save();
      logger.debug({ shipmentId, eventId: eventDoc._id }, 'Raw event written to database.');

      // 2. Fetch all historical event logs for this shipment to reconstruct the chronological path
      // Strictly sort by timestamp ascending to recover from out-of-order data bursts
      const allEvents = await ShipmentEvent.find({ shipmentId }).sort({ timestamp: 1 });

      // 3. Map all events sequentially into the journey's legs array
      const legs = [];
      for (let i = 0; i < allEvents.length; i++) {
        const ev = allEvents[i];
        let dwellDuration = 0;

        // Dwell duration is the interval between arrival at this leg and departure to the next leg
        if (i < allEvents.length - 1) {
          dwellDuration = Math.round((allEvents[i + 1].timestamp.getTime() - ev.timestamp.getTime()) / 1000);
        }

        // Determine if exception tags are present in event metadata
        const weatherException = ev.metadata && (
          ev.metadata.weatherException === true || 
          ev.metadata.weather === 'severe' ||
          ev.metadata.exception === 'weather'
        );

        legs.push({
          sequenceIndex: i,
          locationId: ev.locationId,
          timestamp: ev.timestamp,
          coordinates: ev.coordinates,
          dwellDuration,
          weatherException: !!weatherException,
        });
      }

      // 4. Trigger modular risk evaluation model using the latest logged state
      const latestEvent = allEvents[allEvents.length - 1];
      const { riskScore, status, currentEta } = await evaluateRiskAndEta(legs, latestEvent);

      // 5. Update/Upsert the master ShipmentJourney document
      const journey = await ShipmentJourney.findOneAndUpdate(
        { shipmentId },
        {
          shipmentId,
          status,
          riskScore,
          currentEta,
          legs,
        },
        { new: true, upsert: true }
      );
      
      logger.info(
        { shipmentId, status, riskScore, legsCount: legs.length }, 
        'Shipment journey successfully updated in MongoDB.'
      );

      // 6. Invalidate the Redis cache for this journey to ensure strict cache-aside gateway consistency
      const cacheKey = `journey:${shipmentId}`;
      await redisClient.del(cacheKey);
      logger.debug({ cacheKey }, 'Invalidated cache-aside retrieval cache.');

      // 7. Broadcast the recalculated journey dynamically via WebSockets
      broadcast('risk:update', journey);
      logger.debug({ shipmentId }, 'Broadcasted dynamic risk update to WebSocket clients.');

      return {
        shipmentId,
        journeyId: journey._id,
        status,
        riskScore,
      };
    } catch (err) {
      logger.error({ err, shipmentId }, 'Failed to process shipment event in worker.');
      throw err;
    }
  },
  {
    connection: redisQueueConnection,
    concurrency: 5,
  }
);

journeyWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'BullMQ Worker Job execution failed.');
});

journeyWorker.on('completed', (job, result) => {
  logger.debug({ jobId: job?.id, result }, 'BullMQ Worker Job completed.');
});

export default journeyWorker;
