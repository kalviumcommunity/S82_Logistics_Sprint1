import { Router } from 'express';
import { 
  postShipmentEvent, 
  getShipmentJourney,
  getSystemHealth,
  patchUserRole,
  getWarehouses
} from './controllers/shipmentController.js';

const router = Router();

// Endpoint for high-throughput ingestion of events
router.post('/shipment-events', postShipmentEvent);

// Endpoint for cache-aside journey retrieval
router.get('/shipments/:id/journey', getShipmentJourney);

// Endpoint for gateway system telemetry dashboard
router.get('/health', getSystemHealth);

// Endpoint for administrative role mutations
router.patch('/users/:id/role', patchUserRole);

// Endpoint to fetch seeded logistics warehouses
router.get('/warehouses', getWarehouses);

export default router;
