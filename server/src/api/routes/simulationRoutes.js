import { Router } from 'express';
import { runSimulationController, applySimulationController } from '../controllers/simulationController.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Protected simulation endpoints (ADMIN and OPERATIONS_MANAGER only)
router.post(
  '/run',
  authenticateToken,
  authorizeRoles('ADMIN', 'OPERATIONS_MANAGER'),
  runSimulationController
);

router.post(
  '/apply',
  authenticateToken,
  authorizeRoles('ADMIN', 'OPERATIONS_MANAGER'),
  applySimulationController
);

export default router;
