import express from 'express';
import cors from 'cors';
import ingestRouter from './routes/ingest.routes.js';
import vehicleRouter from './routes/vehicle.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: '*',
    })
  );

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api', ingestRouter);
  app.use('/api', vehicleRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
