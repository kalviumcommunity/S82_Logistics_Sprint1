import { Router } from 'express';
import { processTelemetryPing } from '../controllers/telemetryController.js';

const router = Router();

// Endpoint for hardware GPS ingestion
router.post('/ping', processTelemetryPing);

export default router;
