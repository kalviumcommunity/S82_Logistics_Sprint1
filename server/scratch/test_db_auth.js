import mongoose from 'mongoose';
import logger from '../src/config/logger.js';

async function configureMongoAuth() {
  const NO_AUTH_URI = 'mongodb://localhost:27017/logistics';
  const AUTH_URI = 'mongodb://admin:secure_logistics_password@localhost:27017/logistics?authSource=admin';

  logger.info('Attempting to connect to MongoDB without auth...');
  try {
    const conn = await mongoose.connect(NO_AUTH_URI, { serverSelectionTimeoutMS: 2000 });
    logger.info('Successfully connected to MongoDB without authentication.');
    
    logger.info('Creating admin user on admin database using createUser command...');
    const adminDb = conn.connection.db.admin();
    
    try {
      await adminDb.command({
        createUser: 'admin',
        pwd: 'secure_logistics_password',
        roles: [
          { role: 'root', db: 'admin' },
          { role: 'dbOwner', db: 'logistics' }
        ]
      });
      logger.info('Admin user "admin" created successfully.');
    } catch (createErr) {
      logger.warn({ err: createErr }, 'Could not create admin user (it might already exist).');
    }

    await mongoose.disconnect();
    logger.info('Disconnected. Testing connection with authenticated URI...');
    
    await mongoose.connect(AUTH_URI, { serverSelectionTimeoutMS: 2000 });
    logger.info('SUCCESS: Successfully connected to MongoDB with authenticated URI!');
    await mongoose.disconnect();
    
  } catch (error) {
    logger.error({ err: error }, 'Could not configure MongoDB auth.');
    
    // Try connecting with AUTH_URI directly in case it already exists
    logger.info('Trying to connect with authenticated URI directly...');
    try {
      await mongoose.connect(AUTH_URI, { serverSelectionTimeoutMS: 2000 });
      logger.info('SUCCESS: Direct authenticated connection works.');
      await mongoose.disconnect();
    } catch (authError) {
      logger.fatal({ err: authError }, 'Both unauthenticated and authenticated connections failed!');
    }
  }
}

configureMongoAuth().catch(console.error);
