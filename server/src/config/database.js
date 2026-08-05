import mongoose from 'mongoose';
import logger from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secure_logistics_password@127.0.0.1:27017/logistics?authSource=admin&directConnection=true';

export async function connectDatabase() {
  logger.info(`Initializing MongoDB connection (${MONGODB_URI})...`);
  
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection successfully established.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error occurred.');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected.');
  });

  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    return mongoose.connection;
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to establish initial MongoDB connection.');
    throw error;
  }
}

export default mongoose;
