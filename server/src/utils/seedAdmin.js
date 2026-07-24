import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import logger from '../config/logger.js';

const ADMIN_EMAIL = 'adminlogistics@gmail.com';
const ADMIN_PASSWORD = 'zxcvbnm0987654321';

/**
 * Boots system administrative seed account if missing in MongoDB.
 */
export async function seedAdmin() {
  try {
    logger.info('seedAdmin: Checking database for default ADMIN user...');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL }).lean().exec();
    
    if (!existingAdmin) {
      logger.info('System Bootstrapper: Creating default ADMIN account...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      await User.collection.insertOne({
        email: ADMIN_EMAIL,
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: 'ADMIN',
        assignedFacility: 'HQ-GLOBAL-COMMAND',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.info(`System Bootstrapper: Default ADMIN account created (${ADMIN_EMAIL})`);
    } else {
      logger.info(`System Bootstrapper: Admin account active (${ADMIN_EMAIL})`);
    }
  } catch (error) {
    logger.warn({ err: error.message }, 'Admin bootstrapper encountered exception during seeding');
  }
}

export default seedAdmin;
