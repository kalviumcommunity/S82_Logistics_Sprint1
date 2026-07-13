import mongoose from 'mongoose';
import logger from './logger.js';

const MONGODB_URI = 'mongodb://admin:secure_logistics_password@localhost:27017/logistics?authSource=admin';

export async function connectDatabase() {
  logger.info('Initializing MongoDB connection...');
  
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    return mongoose.connection;
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to establish initial MongoDB connection.');
    throw error;
  }
}

export default mongoose;
