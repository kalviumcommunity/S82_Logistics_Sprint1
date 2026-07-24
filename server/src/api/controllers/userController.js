import User from '../../models/User.js';
import { redisClient } from '../../config/redis.js';
import logger from '../../config/logger.js';

/**
 * GET /api/v1/users
 * Protected (ADMIN only)
 */
export async function getUsers(req, res, next) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const formatted = users.map((u) => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.fullName,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      assignedFacility: u.assignedFacility || 'UNASSIGNED',
      status: u.status,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      status: 'success',
      data: formatted,
      users: formatted,
    });
  } catch (error) {
    logger.error(error, 'Error fetching user list');
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id/role
 * Protected (ADMIN only)
 * Updates user role or assignedFacility and flushes active Redis refresh session
 */
export async function patchUserRole(req, res, next) {
  const { id } = req.params;
  const { role, assignedFacility } = req.body;

  try {
    const updateData = {};
    if (role) {
      const VALID_ROLES = ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'];
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid role specified. Must be one of ${VALID_ROLES.join(', ')}`,
        });
      }
      updateData.role = role;
    }

    if (assignedFacility !== undefined) {
      updateData.assignedFacility = assignedFacility;
    }

    // Try finding by Mongoose ID or fallback
    let user = await User.findById(id).catch(() => null);
    if (!user) {
      user = await User.findOne({ email: id });
    }

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: `User with ID '${id}' not found.`,
      });
    }

    if (updateData.role) user.role = updateData.role;
    if (updateData.assignedFacility !== undefined) user.assignedFacility = updateData.assignedFacility;

    await user.save();

    const userIdStr = user._id.toString();

    // Instantly invalidate active refresh token in Redis cache
    const redisKey = `refresh:${userIdStr}`;
    await redisClient.del(redisKey);
    logger.info({ userId: userIdStr, newRole: user.role, redisKey }, 'User permissions patched & Redis refresh token purged');

    return res.status(200).json({
      status: 'success',
      message: `Permissions updated successfully for user '${user.email}'. Session token invalidated in Redis.`,
      userId: userIdStr,
      role: user.role,
      assignedFacility: user.assignedFacility,
      user: {
        id: userIdStr,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        assignedFacility: user.assignedFacility,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error(error, 'Error patching user role/facility');
    next(error);
  }
}

export default {
  getUsers,
  patchUserRole,
};
