import { Router } from 'express';
import { listVehicles, getVehicleKpisHandler } from '../controllers/vehicle.controller.js';

const router = Router();

router.get('/vehicles', listVehicles);
router.get('/vehicles/:vehicleId/kpis', getVehicleKpisHandler);

export default router;
