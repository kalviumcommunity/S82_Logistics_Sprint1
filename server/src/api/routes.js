import { Router } from 'express';
import { 
  postShipmentEvent, 
  getShipmentJourney,
  getShipmentRiskAnalysis,
  getSystemHealth,
  getWarehouses
} from './controllers/shipmentController.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Auth and User RBAC routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Endpoint for high-throughput ingestion of events
router.post('/shipment-events', postShipmentEvent);

// Endpoint for cache-aside journey retrieval
router.get('/shipments/:id/journey', getShipmentJourney);

// Endpoint for predictive risk factor breakdown analysis (Protected: ADMIN, OPERATIONS_MANAGER)
router.get(
  '/shipments/:id/risk-analysis',
  authenticateToken,
  authorizeRoles('ADMIN', 'OPERATIONS_MANAGER'),
  getShipmentRiskAnalysis
);

// Endpoint for gateway system telemetry dashboard
router.get('/health', getSystemHealth);

// Endpoint to fetch seeded logistics warehouses
router.get('/warehouses', getWarehouses);

export default router;
