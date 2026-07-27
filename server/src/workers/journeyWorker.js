import { Worker } from 'bullmq';
import { redisQueueConnection, redisClient } from '../config/redis.js';
import ShipmentEvent from '../models/ShipmentEvent.js';
import ShipmentJourney from '../models/ShipmentJourney.js';
import Warehouse from '../models/Warehouse.js';
import { broadcast, getIO } from '../config/socket.js';
import logger from '../config/logger.js';

/**
 * Mathematical evaluation of shipment risk score and delivery status
 */
async function evaluateRiskAndEta(legs, currentLegEvent) {
  const warehouse = await Warehouse.findOne({ warehouseId: currentLegEvent.locationId });
  let queueRiskModifier = 0;

  if (warehouse) {
    if (warehouse.currentQueueLength > 10) queueRiskModifier += 25;
    if (warehouse.averageDwellTimeMinutes > 90) queueRiskModifier += 20;
  }

  const weatherDelayCount = legs.reduce((acc, leg) => {
    return acc + (leg.status === 'DELAYED' && leg.delayReason === 'WEATHER' ? 1 : 0);
  }, 0);
  const weatherRiskModifier = weatherDelayCount * 15;

  const totalCalculatedModifier = queueRiskModifier + weatherRiskModifier;
  const rawRiskScore = Math.min(100, Math.max(0, 10 + totalCalculatedModifier));

  let calculatedStatus = 'IN_TRANSIT';
  if (rawRiskScore > 75) {
    calculatedStatus = 'CRITICAL_DELAY';
  } else if (rawRiskScore > 40) {
    calculatedStatus = 'DELAY_RISK';
  }

  const baseDate = new Date(currentLegEvent.timestamp || Date.now());
  const delayHoursAdded = Math.floor(rawRiskScore / 10);
  const expectedEta = new Date(baseDate.getTime() + delayHoursAdded * 3600 * 1000);

  return {
    riskScore: rawRiskScore,
    status: calculatedStatus,
    expectedEta,
  };
}

let journeyWorker = null;

try {
  journeyWorker = new Worker(
    'shipment-events',
    async (job) => {
      const { event: rawEvent } = job.data;
      const { shipmentId } = rawEvent;

      logger.info({ shipmentId, jobName: job.name }, 'Processing shipment event job...');

      try {
        const eventDoc = new ShipmentEvent(rawEvent);
        await eventDoc.save();

        let journey = await ShipmentJourney.findOne({ shipmentId });

        if (!journey) {
          journey = new ShipmentJourney({
            shipmentId,
            origin: rawEvent.locationId || 'HUB-ORIGIN',
            destination: rawEvent.metadata?.destination || 'HUB-DESTINATION',
            status: 'IN_TRANSIT',
            currentRiskScore: 0,
            legs: [],
          });
        }

        journey.legs.push({
          locationId: rawEvent.locationId,
          timestamp: rawEvent.timestamp,
          eventType: rawEvent.eventType,
          status: rawEvent.status || 'NORMAL',
          delayReason: rawEvent.metadata?.delayReason || null,
        });

        const { riskScore, status, expectedEta } = await evaluateRiskAndEta(journey.legs, rawEvent);
        journey.currentRiskScore = riskScore;
        journey.status = status;
        journey.estimatedDelivery = expectedEta;
        journey.updatedAt = new Date();

        await journey.save();

        const cacheKey = `journey:${shipmentId}`;
        await redisClient.set(cacheKey, JSON.stringify(journey), 'EX', 300);

        broadcast('risk:update', journey);

        if (riskScore > 70 || status === 'DELAYED' || status === 'CRITICAL_DELAY' || rawEvent.status === 'DELAYED') {
          const alertPayload = {
            shipmentId,
            status,
            riskScore,
            locationId: rawEvent.locationId || 'HUB-CENTRAL',
            delayReason: rawEvent.metadata?.delayReason || 'Cascading Route Delay',
            timestamp: rawEvent.timestamp || new Date().toISOString(),
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
            logger.info(`[WEBSOCKET] Cascade alert emitted for shipment ${shipmentId} (Score: ${riskScore})`);
          } catch (wsErr) {
            logger.error({ err: wsErr, shipmentId }, 'Failed to emit cascade:alert WebSocket payload');
          }
        }

        return { shipmentId, journeyId: journey._id, status, riskScore };
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
