import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../../models/User.js';
import { redisClient } from '../../config/redis.js';
import logger from '../../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cascading_logistics_jwt_secret_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'cascading_logistics_refresh_secret_key_2026';

// Zod schemas for request validation
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: parseResult.error.format(),
      });
    }

    const { email, password, fullName } = parseResult.data;

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.',
      });
    }

    const user = new User({
      email,
      passwordHash: password, // pre-save hook handles hashing
      fullName,
      role: 'VIEWER', // Default role per specification
      status: 'ACTIVE',
    });

    await user.save();
    logger.info({ userId: user._id, email: user.email }, 'New user registered successfully');

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Initialized with read-only VIEWER access.',
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        assignedFacility: user.assignedFacility,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error(error, 'Error registering user');
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    logger.info({ body: req.body }, 'authController: login request received');

    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: parseResult.error.format(),
      });
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email }).exec();
    logger.info({ email, found: Boolean(user) }, 'authController: User query completed');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password credentials.',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is suspended. Please contact system administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    logger.info({ email, isMatch }, 'authController: bcrypt comparison completed');

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password credentials.',
      });
    }

    const userId = user._id.toString();

    // 15-minute JWT Access Token
    const accessToken = jwt.sign(
      { id: userId, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 7-day Refresh Token
    const refreshToken = jwt.sign(
      { id: userId },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token in Redis (7 days TTL = 604800s)
    try {
      await redisClient.set(`refresh:${userId}`, refreshToken, 'EX', 604800);
    } catch (redisErr) {
      logger.warn({ err: redisErr.message }, 'Redis token cache write skipped during login');
    }

    // Set Refresh Token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in HTTPS production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info({ userId, role: user.role }, 'User authenticated successfully');

    return res.status(200).json({
      status: 'success',
      message: 'Authentication successful.',
      accessToken,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        name: user.fullName,
        role: user.role,
        assignedFacility: user.assignedFacility,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error(error, 'Error in login endpoint');
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        if (decoded?.id) {
          await redisClient.del(`refresh:${decoded.id}`);
        }
      } catch (err) {
        // Ignore token verify error on logout
      }
    }

    res.clearCookie('refreshToken');

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (error) {
    logger.error(error, 'Error during logout');
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing refresh token.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired refresh token.',
      });
    }

    const userId = decoded.id;
    const cachedToken = await redisClient.get(`refresh:${userId}`);

    if (!cachedToken || cachedToken !== refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Session token invalidated or revoked in Redis cache.',
      });
    }

    const user = await User.findById(userId).exec();
    if (!user || user.status === 'SUSPENDED') {
      return res.status(401).json({
        status: 'error',
        message: 'User account not active.',
      });
    }

    const newAccessToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        name: user.fullName,
        role: user.role,
        assignedFacility: user.assignedFacility,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error(error, 'Error refreshing access token');
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 */
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).exec();
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    return res.status(200).json({
      status: 'success',
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        name: user.fullName,
        role: user.role,
        assignedFacility: user.assignedFacility,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  logout,
  refresh,
  me,
};
