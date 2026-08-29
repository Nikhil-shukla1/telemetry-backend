import { processTelemetryBatch } from './telemetry.service.js';

const VEHICLES = ['8646360xxxxxxxx', '8646311xxxxxxxx'];

// In-memory counters to ensure mileage and fuel used continuously INCREASE over time
const state: Record<string, { mileage: number; fuel: number; lat: number; lng: number }> = {
  '8646360xxxxxxxx': {
    mileage: 92400.0,
    fuel: 18340.0,
    lat: 22.051065,
    lng: 83.719253,
  },
  '8646311xxxxxxxx': {
    mileage: 85100.0,
    fuel: 14200.0,
    lat: 22.045000,
    lng: 83.712000,
  },
};

export function generateSamplePayload(ident: string) {
  const current = state[ident] || {
    mileage: 90000.0,
    fuel: 15000.0,
    lat: 22.05,
    lng: 83.71,
  };

  // Incrementally advance location along haul route
  current.lat += (Math.random() - 0.48) * 0.002;
  current.lng += (Math.random() - 0.48) * 0.002;

  // Incrementally advance odometer (+0.2km to +0.5km per minute)
  current.mileage += Number((0.2 + Math.random() * 0.3).toFixed(3));

  // Incrementally advance fuel counter (+0.05L to +0.15L per minute)
  current.fuel += Number((0.05 + Math.random() * 0.1).toFixed(2));

  const speed = Number((15 + Math.random() * 20).toFixed(1));

  return {
    ident,
    timestamp: Date.now() / 1000,
    'codec.id': 8,
    'position.latitude': Number(current.lat.toFixed(6)),
    'position.longitude': Number(current.lng.toFixed(6)),
    'position.altitude': 245,
    'position.direction': Math.floor(Math.random() * 360),
    'position.satellites': 7 + Math.floor(Math.random() * 5),
    'position.speed': speed,
    'position.valid': true,
    'engine.ignition.status': true,
    'movement.status': true,
    'vehicle.mileage': Number(current.mileage.toFixed(3)),
    'engine.total.fuel.used': Number(current.fuel.toFixed(2)),
    'battery.voltage': 4.05,
    'external.powersource.voltage': 27.8,
    'gsm.signal.level': 4,
  };
}

let intervalId: NodeJS.Timeout | null = null;

export function startTelemetrySimulator(intervalMs: number = 60000) {
  if (intervalId) return;

  console.log(`[Telemetry Simulator] Started 1-minute automated data logger for 2 vehicles (${VEHICLES.join(', ')})`);

  // Initial immediate push on server startup
  pushBatch();

  // Recurring 1-minute interval timer
  intervalId = setInterval(pushBatch, intervalMs);
}

async function pushBatch() {
  try {
    const batch = VEHICLES.map((ident) => generateSamplePayload(ident));
    const result = await processTelemetryBatch(batch);
    console.log(
      `[Telemetry Simulator Log - ${new Date().toLocaleTimeString()}] Pushed 1-min telematics batch: stored=${result.stored}, duplicates=${result.duplicates}`
    );
  } catch (error) {
    console.error('[Telemetry Simulator Error] Failed to push automated telemetry batch:', error);
  }
}

export function stopTelemetrySimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Telemetry Simulator] Stopped data logger');
  }
}
