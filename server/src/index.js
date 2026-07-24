import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { connectDatabase } from './config/database.js';
import { redisClient, redisQueueConnection } from './config/redis.js';
import { initSocket, broadcast } from './config/socket.js';
import { setupStreamConsumer, startStreamConsumer } from './workers/streamConsumer.js';
import './workers/journeyWorker.js'; // Ensure worker is loaded and started
import routes from './api/routes.js';
import logger from './config/logger.js';
import { seedAdmin } from './utils/seedAdmin.js';

const app = express();
const INITIAL_PORT = process.env.PORT || 3000;

// Create HTTP server wrapper for Socket.io support
const server = createServer(app);
initSocket(server);

// Cookie parsing middleware
app.use(cookieParser());

// Self-contained CORS middleware to support client requests from dev server
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// System health probe
app.get('/api/v1/health', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
    
    // Test Redis connectivity safely
    let redisStatus = 'degraded';
    try {
      const ping = await redisClient.ping();
      if (ping === 'PONG') redisStatus = 'healthy';
    } catch (e) {
      redisStatus = 'degraded';
    }

    const overallStatus = (mongoStatus === 'healthy' && redisStatus === 'healthy') ? 'OK' : 'DEGRADED';

    return res.status(overallStatus === 'OK' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: mongoStatus,
        cache: redisStatus,
        sockets: 'healthy',
      },
    });
  } catch (error) {
    logger.error(error, 'Health check failed');
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err, 'Unhandled error in gateway assembly');
  res.status(500).json({
    status: 'error',
    message: 'An unexpected internal error occurred on the gateway.',
  });
});

/**
 * Helper to start server listening on an available port if initial port is occupied (EADDRINUSE)
 */
function startServerWithPortFallback(portToTry) {
  const port = Number(portToTry);

  const onError = (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is already in use (EADDRINUSE). Automatically switching to next available port ${port + 1}...`);
      server.removeListener('error', onError);
      startServerWithPortFallback(port + 1);
    } else {
      logger.error({ err: error }, 'Server listener error occurred.');
    }
  };

  server.once('error', onError);

  server.listen(port, '0.0.0.0', () => {
    server.removeListener('error', onError);
    logger.info(`Cascading Logistics Gateways started successfully on http://localhost:${port}`);
  });
}

/**
 * Main application bootstrap process.
 * Boots the connection pools, runs sanity health checks,
 * initializes workers/stream pollers, and starts listening.
 */
async function bootstrap() {
  try {
    // 1. Initialize MongoDB Connection
    await connectDatabase();
    
    // 2. Open Port Listener with automatic EADDRINUSE port fallback
    startServerWithPortFallback(INITIAL_PORT);

    // 3. System Bootstrapper: Seed Admin Account
    await seedAdmin();

    // 4. Perform active database and cache runtime health checks
    logger.info('Performing startup runtime health checks on infrastructure pools...');
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection is not in a ready state.');
    }

    // 5. Initialize BullMQ Stream Consumer
    logger.info('Initializing BullMQ Stream Consumer pipeline...');
    await setupStreamConsumer();
    startStreamConsumer();

    // 6. Broadcast periodic infrastructure telemetry via Socket.io (every 5s)
    setInterval(async () => {
      try {
        const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
        let redisStatus = 'degraded';
        try {
          const ping = await redisClient.ping();
          if (ping === 'PONG') redisStatus = 'healthy';
        } catch (e) {
          redisStatus = 'degraded';
        }

        broadcast('system:telemetry', {
          timestamp: new Date().toISOString(),
          mongoStatus,
          redisStatus,
          uptime: process.uptime(),
        });
      } catch (err) {
        logger.error(err, 'Failed to broadcast telemetry via Socket.io');
      }
    }, 5000);

    logger.info('Cascading Logistics Gateway Assembly initialized cleanly and ready for traffic.');
  } catch (fatalError) {
    logger.fatal({ err: fatalError }, 'Fatal initialization error during gateway assembly bootstrap.');
    process.exit(1);
  }
}

// Execute bootstrap procedure
bootstrap();
