import { Router } from 'express';
import { runSimulationController, applySimulationController } from '../controllers/simulationController.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Protected simulation endpoints (ADMIN and OPERATIONS_MANAGER generally, but run allows VIEWER for map display)
router.post(
  '/run',
  authenticateToken,
  authorizeRoles('ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'),
  runSimulationController
);

router.post(
  '/apply',
  authenticateToken,
  authorizeRoles('ADMIN', 'OPERATIONS_MANAGER'),
  applySimulationController
);

export default router;
