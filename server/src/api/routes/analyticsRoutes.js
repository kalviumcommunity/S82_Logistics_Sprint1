import { Router } from 'express';
import {
  getPipelineQualityController,
  getDashboardSummaryController,
  getAdminDashboardController,
} from '../controllers/analyticsController.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Protected analytics endpoint for pipeline quality (ADMIN and OPERATIONS_MANAGER)
router.get(
  '/pipeline-quality',
  authenticateToken,
  authorizeRoles('ADMIN', 'OPERATIONS_MANAGER'),
  getPipelineQualityController
);

// Protected analytics dashboard summary endpoint (ADMIN only)
router.get(
  '/dashboard-summary',
  authenticateToken,
  authorizeRoles('ADMIN'),
  getDashboardSummaryController
);

// Protected admin analytics dashboard endpoint (ADMIN only)
router.get(
  '/admin-dashboard',
  authenticateToken,
  authorizeRoles('ADMIN'),
  getAdminDashboardController
);

export default router;
