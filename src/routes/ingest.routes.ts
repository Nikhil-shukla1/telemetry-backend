import { Router } from 'express';
import { ingestTelemetry } from '../controllers/ingest.controller.js';

const router = Router();

// Public ingest endpoint without token authentication
router.post('/ingest', ingestTelemetry);

export default router;
