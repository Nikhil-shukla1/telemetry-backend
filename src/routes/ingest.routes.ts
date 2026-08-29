import { Router } from 'express';
import { ingestTelemetry } from '../controllers/ingest.controller.js';
import { authenticateIngest } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint protected with Bearer Token middleware
router.post('/ingest', authenticateIngest, ingestTelemetry);

export default router;
