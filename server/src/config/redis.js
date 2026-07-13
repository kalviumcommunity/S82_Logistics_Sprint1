import Redis from 'ioredis';
import logger from './logger.js';

const REDIS_HOST = '127.0.0.1';
const REDIS_PORT = 6379;

const baseOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

logger.info(`Configuring Redis connections to ${REDIS_HOST}:${REDIS_PORT}...`);

// Profile 1: General memory cache / Stream ingestion & operations
export const redisClient = new Redis({
  ...baseOptions,
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  logger.info('General caching Redis client connected.');
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'General caching Redis client error.');
});

// Profile 2: Dedicated connection exclusively for BullMQ Workers and Queues
export const redisQueueConnection = new Redis({
  ...baseOptions,
  maxRetriesPerRequest: null, // Required for BullMQ
});

redisQueueConnection.on('connect', () => {
  logger.info('BullMQ dedicated Redis client connected.');
});

redisQueueConnection.on('error', (err) => {
  logger.error({ err }, 'BullMQ dedicated Redis client error.');
});

export default {
  redisClient,
  redisQueueConnection,
};
