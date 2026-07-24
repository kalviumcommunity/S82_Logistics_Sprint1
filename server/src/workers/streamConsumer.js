import { Queue } from 'bullmq';
import { redisClient, redisQueueConnection } from '../config/redis.js';
import logger from '../config/logger.js';

const STREAM_NAME = 'shipment:stream:events';
const GROUP_NAME = 'shipment:group';
const CONSUMER_NAME = 'shipment:consumer:1';

// Initialize the BullMQ Queue
export let shipmentQueue = null;
try {
  shipmentQueue = new Queue('shipment-events', {
    connection: redisQueueConnection,
  });
  shipmentQueue.on('error', () => {});
} catch (e) {
  logger.warn('BullMQ shipmentQueue operating in fallback mode.');
}

let isRunning = false;

/**
 * Initialize stream consumer group
 */
export async function setupStreamConsumer() {
  try {
    // Attempt to create the consumer group and stream
    await redisClient.xgroup('CREATE', STREAM_NAME, GROUP_NAME, '$', 'MKSTREAM');
    logger.info(`Redis Consumer Group '${GROUP_NAME}' created successfully.`);
  } catch (err) {
    if (err.message && err.message.includes('BUSYGROUP')) {
      logger.debug(`Redis Consumer Group '${GROUP_NAME}' already exists.`);
    } else {
      logger.error({ err }, 'Failed to initialize Redis Stream consumer group.');
    }
  }
}

/**
 * Starts polling the Redis Stream for new events and adding them as jobs to BullMQ
 */
export async function startStreamConsumer() {
  if (isRunning) return;
  isRunning = true;

  logger.info('Starting Redis Stream consumer background poller...');

  while (isRunning) {
    try {
      // Poll new messages from stream group, blocking for up to 2000ms
      const response = await redisClient.xreadgroup(
        'GROUP', GROUP_NAME, CONSUMER_NAME,
        'COUNT', '10',
        'BLOCK', '2000',
        'STREAMS', STREAM_NAME,
        '>'
      );

      if (!response || response.length === 0) {
        continue;
      }

      for (const [stream, messages] of response) {
        for (const [messageId, fields] of messages) {
          let payloadStr = '';

          // Parse key-value list to find the 'payload' field
          for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'payload') {
              payloadStr = fields[i + 1];
              break;
            }
          }

          if (payloadStr) {
            const eventPayload = JSON.parse(payloadStr);

            // Add job to BullMQ queue
            await shipmentQueue.add('process-event', {
              streamMessageId: messageId,
              event: eventPayload,
            });

            logger.debug({ shipmentId: eventPayload.shipmentId, messageId }, 'Event routed to BullMQ Queue.');
          }

          // Acknowledge receipt to clear it from the Pending Entries List (PEL)
          await redisClient.xack(STREAM_NAME, GROUP_NAME, messageId);
        }
      }
    } catch (err) {
      logger.error(err, 'Error in Redis Stream poller loop. Retrying in 5 seconds...');
      // Hold off slightly on error to prevent CPU thrashing
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Stops the polling loop
 */
export function stopStreamConsumer() {
  isRunning = false;
  logger.info('Redis Stream consumer poller stopped.');
}
