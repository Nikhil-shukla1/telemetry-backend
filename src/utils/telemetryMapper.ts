/**
 * Unflattens flat dot-notation keys (e.g. "position.latitude") into nested objects using key.split('.').
 */
export function unflatten(raw: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;

    const parts = key.split('.');
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}

export function parseTimestamp(rawTs: any): Date {
  if (typeof rawTs === 'number') {
    const tsMs = rawTs < 1e10 ? rawTs * 1000 : rawTs;
    const d = new Date(tsMs);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof rawTs === 'string') {
    const d = new Date(rawTs);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function mapRawPayloadToStructured(rawPayload: Record<string, any>) {
  const data = unflatten(rawPayload);

  const ident = data.ident || data.device?.ident || data.id || rawPayload['ident'];
  if (!ident || typeof ident !== 'string') {
    return null;
  }

  const timestamp = parseTimestamp(data.timestamp || data.time || rawPayload['timestamp']);
  const pos = typeof data.position === 'object' ? data.position : {};
  const eng = typeof data.engine === 'object' ? data.engine : {};
  const veh = typeof data.vehicle === 'object' ? data.vehicle : {};
  const mov = typeof data.movement === 'object' ? data.movement : {};

  const num = (v: any) => {
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (typeof v === 'string') {
      const parsed = parseFloat(v);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  const bool = (v: any) => (typeof v === 'boolean' ? v : v === 1 ? true : v === 0 ? false : undefined);

  // Extract fuel used from nested unflattened or raw dot notation
  const fuelUsed = num(
    eng.totalFuelUsed ??
      eng.total?.fuel?.used ??
      rawPayload['engine.total.fuel.used'] ??
      rawPayload['engine.totalFuelUsed'] ??
      rawPayload['fuel.used']
  );

  const mileage = num(
    veh.mileage ??
      rawPayload['vehicle.mileage'] ??
      rawPayload['mileage'] ??
      rawPayload['odometer'] ??
      data.mileage
  );

  return {
    ident: String(ident),
    timestamp,
    position: {
      latitude: num(pos.latitude ?? rawPayload['position.latitude']),
      longitude: num(pos.longitude ?? rawPayload['position.longitude']),
      altitude: num(pos.altitude ?? rawPayload['position.altitude']),
      direction: num(pos.direction ?? rawPayload['position.direction']),
      satellites: num(pos.satellites ?? rawPayload['position.satellites']),
      speed: num(pos.speed ?? rawPayload['position.speed']),
      valid: bool(pos.valid ?? rawPayload['position.valid']),
    },
    engine: {
      ignitionStatus: bool(eng.ignitionStatus ?? eng.ignition?.status ?? rawPayload['engine.ignition.status']),
      totalFuelUsed: fuelUsed,
    },
    movementStatus: bool(data.movementStatus ?? mov.status ?? rawPayload['movement.status']),
    vehicle: {
      mileage,
    },
    batteryVoltage: num(data.batteryVoltage ?? data.battery?.voltage ?? rawPayload['battery.voltage']),
    externalPowerVoltage: num(data.externalPowerVoltage ?? data.external?.powersource?.voltage ?? rawPayload['external.powersource.voltage']),
    gsmSignalLevel: num(data.gsmSignalLevel ?? data.gsm?.signal?.level ?? rawPayload['gsm.signal.level']),
  };
}
