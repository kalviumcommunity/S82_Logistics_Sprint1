import { Router } from 'express';
import { postShipmentEvent, getShipmentJourney } from './controllers/shipmentController.js';

const router = Router();

// Endpoint for high-throughput ingestion of events
router.post('/shipment-events', postShipmentEvent);

// Endpoint for cache-aside journey retrieval
router.get('/shipments/:id/journey', getShipmentJourney);

export default router;
