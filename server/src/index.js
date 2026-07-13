import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import { redisClient, redisQueueConnection } from './config/redis.js';
import { setupStreamConsumer, startStreamConsumer } from './workers/streamConsumer.js';
import './workers/journeyWorker.js'; // Ensure worker is loaded and started
import routes from './api/routes.js';
import logger from './config/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Standard json parsing middleware
app.use(express.json());

// Express structured request logging middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      latencyMs: latencyMs.toFixed(2),
    }, 'Gateway HTTP Request');
  });
  next();
});

// Ingestion and retrieval routes
app.use('/api/v1', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err, 'Unhandled error in gateway assembly');
  res.status(500).json({
    status: 'error',
    message: 'An unexpected internal error occurred on the gateway.',
  });
});

/**
 * Boots the connection pools, runs sanity health checks,
 * initializes workers/stream pollers, and starts listening.
 */
async function bootstrap() {
  try {
    // 1. Initialize MongoDB Connection
    await connectDatabase();

    // 2. Perform active database and cache runtime health checks
    logger.info('Performing startup runtime health checks on infrastructure pools...');
    
    // Check MongoDB Connection State
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection is not in a ready state.');
    }
    logger.info('Active MongoDB client check: READY.');

    // Ping Redis Client
    const redisHealth = await redisClient.ping();
    if (redisHealth !== 'PONG') {
      throw new Error(`General Redis client failed healthcheck (response: ${redisHealth})`);
    }
    logger.info('Active general caching Redis client check: READY.');

    // Ping Queue Connection
    const queueRedisHealth = await redisQueueConnection.ping();
    if (queueRedisHealth !== 'PONG') {
      throw new Error(`BullMQ Redis client failed healthcheck (response: ${queueRedisHealth})`);
    }
    logger.info('Active BullMQ queue Redis client check: READY.');

    // 3. Setup Stream Consumer Group
    await setupStreamConsumer();

    // Start background stream poller loop (asynchronous, does not block server listener)
    startStreamConsumer();
    logger.info('Stream consumer background process started.');

    // 4. Open Port Listener
    app.listen(PORT, () => {
      logger.info(`Cascading Logistics Gateways started on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.fatal(error, 'Bootstrap health checks failed. Process aborting.');
    process.exit(1);
  }
}

// Graceful platform termination
const handleTermination = async (signal) => {
  logger.info(`Received ${signal}. Gracefully stopping platform engine...`);
  
  try {
    await redisClient.quit();
    await redisQueueConnection.quit();
    logger.info('Redis connections closed.');
  } catch (err) {
    logger.error(err, 'Error closing Redis connections on shutdown.');
  }

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connections closed.');
  } catch (err) {
    logger.error(err, 'Error closing MongoDB connections on shutdown.');
  }

  logger.info('Platform engine stopped successfully.');
  process.exit(0);
};

process.on('SIGTERM', () => handleTermination('SIGTERM'));
process.on('SIGINT', () => handleTermination('SIGINT'));

bootstrap();
