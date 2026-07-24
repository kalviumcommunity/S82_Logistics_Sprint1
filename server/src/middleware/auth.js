import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cascading_logistics_jwt_secret_key_2026';

/**
 * Middleware: authenticateToken
 * Verifies JWT signature from Bearer header or cookie and attaches req.user
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const tokenFromCookie = req.cookies?.accessToken;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access Denied: Missing authentication token.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ error: error.message }, 'JWT Token verification failed');
    return res.status(401).json({
      status: 'error',
      message: 'Access Denied: Invalid or expired token.',
    });
  }
}

/**
 * Middleware: authorizeRoles
 * Checks if req.user.role matches allowed role parameters
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Access Forbidden: User role context missing.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.id, userRole: req.user.role, requiredRoles: allowedRoles },
        'Unauthorized role access attempt blocked'
      );
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
}

export default {
  authenticateToken,
  authorizeRoles,
};
