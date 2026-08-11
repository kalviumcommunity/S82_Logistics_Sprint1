import { Router } from 'express';
import { 
  postShipmentEvent, 
  getShipmentJourney,
  getShipmentRiskAnalysis,
  getSystemHealth,
  getWarehouses,
  getActiveShipments
} from './controllers/shipmentController.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Auth, User RBAC, Simulation, and Analytics routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/simulations', simulationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/telemetry', telemetryRoutes);

// Endpoint for high-throughput ingestion of events
router.post('/shipment-events', postShipmentEvent);

// Endpoint for cache-aside journey retrieval
router.get('/shipments/:id/journey', getShipmentJourney);

// Endpoint for retrieving all active shipments
router.get('/shipments/active', getActiveShipments);

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
