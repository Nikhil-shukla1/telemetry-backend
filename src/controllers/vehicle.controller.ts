import { Request, Response, NextFunction } from 'express';
import { Vehicle } from '../models/vehicle.js';
import { getVehicleKpis } from '../services/kpi.service.js';
import { kpiQuerySchema } from '../schemas/kpi.schema.js';

export async function listVehicles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicles = await Vehicle.find().sort({ lastSeenAt: -1 }).lean();
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
}

export async function getVehicleKpisHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicleId = String(req.params.vehicleId);

    const validationResult = kpiQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: validationResult.error.flatten(),
      });
      return;
    }

    const { from, to } = validationResult.data;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const kpis = await getVehicleKpis(vehicleId, fromDate, toDate);

    res.status(200).json(kpis);
  } catch (error) {
    next(error);
  }
}
