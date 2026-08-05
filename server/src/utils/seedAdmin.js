import User from '../models/User.js';
import logger from '../config/logger.js';

const ADMIN_EMAIL = 'adminlogistics@gmail.com';
const ADMIN_PASSWORD = 'zxcvbnm0987654321';

/**
 * Boots system administrative seed account if missing in MongoDB or elevates it to ADMIN.
 */
export async function seedAdmin() {
  try {
    logger.info('seedAdmin: Checking database for default ADMIN user...');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL }).exec();
    
    if (!existingAdmin) {
      logger.info('System Bootstrapper: Creating default ADMIN account...');
      const adminUser = new User({
        email: ADMIN_EMAIL,
        passwordHash: ADMIN_PASSWORD, // Pre-save hook will hash this password
        fullName: 'System Administrator',
        role: 'ADMIN',
        assignedFacility: 'HQ-GLOBAL-COMMAND',
        status: 'ACTIVE',
      });
      await adminUser.save();
      logger.info(`System Bootstrapper: Default ADMIN account created (${ADMIN_EMAIL})`);
    } else {
      let needsUpdate = false;
      if (existingAdmin.role !== 'ADMIN') {
        existingAdmin.role = 'ADMIN';
        needsUpdate = true;
      }
      if (existingAdmin.status !== 'ACTIVE') {
        existingAdmin.status = 'ACTIVE';
        needsUpdate = true;
      }
      const isPasswordValid = await existingAdmin.comparePassword(ADMIN_PASSWORD).catch(() => false);
      if (!isPasswordValid) {
        existingAdmin.passwordHash = ADMIN_PASSWORD; // Pre-save hook will rehash
        needsUpdate = true;
      }
      if (needsUpdate) {
        await existingAdmin.save();
        logger.info(`System Bootstrapper: Admin account attributes synchronized (${ADMIN_EMAIL})`);
      } else {
        logger.info(`System Bootstrapper: Admin account active (${ADMIN_EMAIL})`);
      }
    }
  } catch (error) {
    logger.warn({ err: error.message }, 'Admin bootstrapper encountered exception during seeding');
  }
}

export default seedAdmin;
