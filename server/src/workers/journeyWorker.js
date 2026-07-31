import { Worker } from 'bullmq';
import { redisQueueConnection, redisClient } from '../config/redis.js';
import ShipmentEvent from '../models/ShipmentEvent.js';
import ShipmentJourney from '../models/ShipmentJourney.js';
import Warehouse from '../models/Warehouse.js';
import { calculatePredictiveRisk } from '../services/riskEngine.js';
import { broadcast, getIO } from '../config/socket.js';
import logger from '../config/logger.js';

/**
 * Fetch live node state from Redis RAM (sub-2ms), falling back to DB if unpopulated
 */
async function getWarehouseTelemetryFromRedis(locationId) {
  if (!locationId) return {};
  try {
    const redisData = await redisClient.hgetall('graph:warehouse:' + locationId);
    if (redisData && Object.keys(redisData).length > 0) {
      return {
        warehouseId: locationId,
        name: redisData.name || locationId,
        currentQueueLength: parseInt(redisData.currentQueueLength || '0', 10),
        dwellTimeAvg: parseInt(redisData.dwellTimeAvg || '0', 10),
        capacity: parseInt(redisData.capacity || '15', 10),
      };
    }

    // Fallback query to MongoDB Warehouse
    const whDoc = await Warehouse.findOne({ warehouseId: locationId });
    if (whDoc) {
      const whData = {
        name: whDoc.name,
        currentQueueLength: String(whDoc.currentQueueLength || 0),
        dwellTimeAvg: String(whDoc.dwellTimeAvg || 0),
        capacity: '15',
      };
      await redisClient.hset('graph:warehouse:' + locationId, whData);
      return {
        warehouseId: locationId,
        name: whDoc.name,
        currentQueueLength: whDoc.currentQueueLength || 0,
        dwellTimeAvg: whDoc.dwellTimeAvg || 0,
        capacity: 15,
      };
    }
  } catch (err) {
    logger.warn({ err, locationId }, 'Failed to fetch warehouse telemetry from Redis');
  }
  return { warehouseId: locationId, currentQueueLength: 0, dwellTimeAvg: 0, capacity: 15 };
}

/**
 * Fetch edge telemetry from Redis RAM (weather, traffic, congestion)
 */
async function getEdgeTelemetryFromRedis(currentLocation, nextLocation) {
  if (!currentLocation || !nextLocation) return {};
  try {
    const key = `graph:edge:${currentLocation}:${nextLocation}`;
    const redisData = await redisClient.hgetall(key);
    return redisData || {};
  } catch (err) {
    logger.warn({ err, currentLocation, nextLocation }, 'Failed to fetch edge telemetry from Redis');
    return {};
  }
}

let journeyWorker = null;

try {
  journeyWorker = new Worker(
    'shipment-events',
    async (job) => {
      const { event: rawEvent } = job.data;
      const { shipmentId, locationId, nextLocationId } = rawEvent;

      logger.info({ shipmentId, jobName: job.name }, 'Processing shipment event job...');

      try {
        const eventDoc = new ShipmentEvent(rawEvent);
        await eventDoc.save();

        let journey = await ShipmentJourney.findOne({ shipmentId });

        if (!journey) {
          journey = new ShipmentJourney({
            shipmentId,
            origin: locationId || 'HUB-ORIGIN',
            destination: rawEvent.metadata?.destination || nextLocationId || 'HUB-DESTINATION',
            status: 'SAFE',
            riskScore: 0,
            currentEta: new Date(Date.now() + 7200000),
            legs: [],
          });
        }

        const legDwell = rawEvent.dwellDuration ?? rawEvent.metadata?.dwellDuration ?? 0;
        const weatherException = rawEvent.weatherException ?? rawEvent.metadata?.weatherException ?? false;

        journey.legs.push({
          sequenceIndex: journey.legs.length,
          locationId: locationId || 'HUB-UNKNOWN',
          timestamp: rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date(),
          coordinates: {
            type: 'Point',
            coordinates: rawEvent.coordinates || [0, 0],
          },
          dwellDuration: legDwell,
          weatherException: Boolean(weatherException),
        });

        // Redis Sub-2ms Topology & Telemetry Lookup
        const currentFacility = await getWarehouseTelemetryFromRedis(locationId);
        currentFacility.actualDwell = legDwell;

        const nextFacilityId = nextLocationId || rawEvent.metadata?.nextLocationId;
        const nextFacility = await getWarehouseTelemetryFromRedis(nextFacilityId);

        const routeTelemetry = await getEdgeTelemetryFromRedis(locationId, nextFacilityId);
        if (weatherException) {
          routeTelemetry.weatherException = true;
        }

        // Run Predictive Risk Engine calculation
        const riskResult = calculatePredictiveRisk(
          {
            promisedSlaEta: journey.currentEta || journey.estimatedDelivery,
            remainingTransitMs: 3600000,
          },
          currentFacility,
          nextFacility,
          routeTelemetry
        );

        const { overallRiskScore, status, predictedDelayMinutes } = riskResult;

        journey.riskScore = overallRiskScore;
        if (journey.currentRiskScore !== undefined) {
          journey.currentRiskScore = overallRiskScore;
        }
        journey.status = status;

        // Dynamic ETA calculation based on predicted delay minutes
        const baseTimestamp = rawEvent.timestamp ? new Date(rawEvent.timestamp).getTime() : Date.now();
        const revisedEtaMs = baseTimestamp + (3600000 + predictedDelayMinutes * 60000);
        journey.currentEta = new Date(revisedEtaMs);
        if (journey.estimatedDelivery !== undefined) {
          journey.estimatedDelivery = journey.currentEta;
        }

        await journey.save();

        // Purge retrieval cache in Redis (journey:${shipmentId})
        const cacheKey = `journey:${shipmentId}`;
        await redisClient.del(cacheKey);

        // Broadcast risk update
        broadcast('risk:update', journey);

        // Real-time WebSocket Alert Pipeline for high risk
        if (overallRiskScore > 70 || status === 'DELAYED') {
          const alertPayload = {
            shipmentId,
            status,
            riskScore: overallRiskScore,
            locationId: locationId || 'HUB-CENTRAL',
            delayReason: rawEvent.metadata?.delayReason || `Predicted Cascading Delay (+${predictedDelayMinutes}m)`,
            timestamp: rawEvent.timestamp || new Date().toISOString(),
            riskFactors: riskResult.factors,
            predictedDelayMinutes,
          };

          try {
            const io = getIO();
            if (io) {
              io.emit('cascade:alert', alertPayload);
              io.to('room:operations').emit('cascade:alert', alertPayload);
              io.to(`room:shipment:${shipmentId}`).emit('cascade:alert', alertPayload);
            } else {
              broadcast('cascade:alert', alertPayload);
              broadcast('cascade:alert', alertPayload, 'room:operations');
            }
            logger.info(`[WEBSOCKET] Cascade alert emitted for shipment ${shipmentId} (Risk Score: ${overallRiskScore})`);
          } catch (wsErr) {
            logger.error({ err: wsErr, shipmentId }, 'Failed to emit cascade:alert WebSocket payload');
          }
        }

        return { shipmentId, journeyId: journey._id, status, riskScore: overallRiskScore };
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

  journeyWorker.on('error', () => {});
} catch (err) {
  logger.warn('BullMQ worker disabled (running in-memory fallback queue mode)');
}

export default journeyWorker;
