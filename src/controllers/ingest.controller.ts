import { Request, Response, NextFunction } from 'express';
import { processTelemetryBatch } from '../services/telemetry.service.js';

export async function ingestTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawBatch = req.body;

    if (!Array.isArray(rawBatch)) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Request body must be a JSON array of telemetry objects',
      });
      return;
    }

    const batchResult = await processTelemetryBatch(rawBatch);

    res.status(200).json(batchResult);
  } catch (error) {
    next(error);
  }
}
