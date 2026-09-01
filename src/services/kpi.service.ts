import { Telemetry, ITelemetry } from '../models/telemetry.js';

export interface GpsTrackPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  timestamp: string;
}

function parseNum(val: any): number | undefined {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

export function calculateAverageSpeed(items: Partial<ITelemetry>[]): number {
  const speeds = items
    .map((i) => parseNum(i.position?.speed ?? i.rawPayload?.['position.speed'] ?? i.rawPayload?.position?.speed ?? i.rawPayload?.speed))
    .filter((s): s is number => typeof s === 'number' && !isNaN(s) && s >= 0 && isFinite(s));

  if (speeds.length === 0) return 0;
  const avg = speeds.reduce((sum, val) => sum + val, 0) / speeds.length;
  return Number(avg.toFixed(2));
}

export function calculateTotalDistance(items: Partial<ITelemetry>[]): number {
  const mileages = items
    .map((i) => parseNum(i.vehicle?.mileage ?? i.rawPayload?.['vehicle.mileage'] ?? i.rawPayload?.vehicle?.mileage ?? i.rawPayload?.mileage ?? i.rawPayload?.odometer))
    .filter((m): m is number => typeof m === 'number' && !isNaN(m) && m >= 0 && isFinite(m));

  if (mileages.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < mileages.length; i++) {
    const delta = mileages[i] - mileages[i - 1];
    if (delta > 0) total += delta;
  }

  return Number(total.toFixed(3));
}

export function calculateTotalFuelUsed(items: Partial<ITelemetry>[]): number {
  const fuels = items
    .map((i) => parseNum(i.engine?.totalFuelUsed ?? i.rawPayload?.['engine.total.fuel.used'] ?? i.rawPayload?.['engine.totalFuelUsed'] ?? i.rawPayload?.engine?.totalFuelUsed))
    .filter((f): f is number => typeof f === 'number' && !isNaN(f) && f >= 0 && isFinite(f));

  if (fuels.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < fuels.length; i++) {
    const delta = fuels[i] - fuels[i - 1];
    if (delta > 0) total += delta;
  }

  return Number(total.toFixed(2));
}

export function extractGpsTrack(items: Partial<ITelemetry>[]): GpsTrackPoint[] {
  const track: GpsTrackPoint[] = [];

  for (const item of items) {
    const pos = item.position || {};
    const rawPos = item.rawPayload?.position || {};

    const valid = pos.valid ?? item.rawPayload?.['position.valid'] ?? rawPos.valid;
    const lat = parseNum(pos.latitude ?? item.rawPayload?.['position.latitude'] ?? rawPos.latitude);
    const lng = parseNum(pos.longitude ?? item.rawPayload?.['position.longitude'] ?? rawPos.longitude);
    const alt = parseNum(pos.altitude ?? item.rawPayload?.['position.altitude'] ?? rawPos.altitude);
    const spd = parseNum(pos.speed ?? item.rawPayload?.['position.speed'] ?? rawPos.speed);

    const isValid = valid !== false && valid !== 0 && valid !== 'false';

    if (
      isValid &&
      typeof lat === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      typeof lng === 'number' &&
      lng >= -180 &&
      lng <= 180
    ) {
      const ts = item.timestamp instanceof Date ? item.timestamp.toISOString() : new Date(item.timestamp || Date.now()).toISOString();
      track.push({
        latitude: lat,
        longitude: lng,
        altitude: alt,
        speed: spd,
        timestamp: ts,
      });
    }
  }

  return track;
}

export async function getVehicleKpis(vehicleIdent: string, fromDate?: Date, toDate?: Date) {
  const now = new Date();
  const queryFrom = fromDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const queryTo = toDate || now;

  const items = await Telemetry.find({
    vehicleIdent,
    timestamp: { $gte: queryFrom, $lte: queryTo },
  })
    .sort({ timestamp: 1 })
    .lean<ITelemetry[]>();

  return {
    vehicleIdent,
    timeRange: {
      from: queryFrom.toISOString(),
      to: queryTo.toISOString(),
    },
    averageSpeed: calculateAverageSpeed(items),
    totalDistance: calculateTotalDistance(items),
    fuelUsed: calculateTotalFuelUsed(items),
    track: extractGpsTrack(items),
    sampleCount: items.length,
  };
}

