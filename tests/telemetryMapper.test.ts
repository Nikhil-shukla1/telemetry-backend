import { describe, it, expect } from 'vitest';
import { mapRawPayloadToStructured, unflatten } from '../src/utils/telemetryMapper.js';

describe('Telemetry Mapper & Extra Data Preservation Unit Tests', () => {
  it('correctly maps flat Flespi dot-notation payload to structured fields', () => {
    const rawFlespiPayload = {
      ident: '8646360xxxxxxxx',
      timestamp: 1787042687.000,
      'codec.id': 8,
      'position.latitude': 22.051065,
      'position.longitude': 83.719253,
      'position.altitude': 245,
      'position.direction': 145,
      'position.satellites': 7,
      'position.speed': 18.5,
      'position.valid': true,
      'engine.ignition.status': true,
      'movement.status': true,
      'vehicle.mileage': 92400.461,
      'engine.total.fuel.used': 18342.5,
      'battery.voltage': 4.05,
      'external.powersource.voltage': 27.8,
      'gsm.signal.level': 4,
      'unknown.future.field': 'custom_val',
    };

    const mapped = mapRawPayloadToStructured(rawFlespiPayload);

    expect(mapped).not.toBeNull();
    expect(mapped?.ident).toBe('8646360xxxxxxxx');
    expect(mapped?.position?.latitude).toBe(22.051065);
    expect(mapped?.position?.longitude).toBe(83.719253);
    expect(mapped?.position?.speed).toBe(18.5);
    expect(mapped?.position?.valid).toBe(true);
    expect(mapped?.vehicle?.mileage).toBe(92400.461);
    expect(mapped?.engine?.totalFuelUsed).toBe(18342.5);
    expect(mapped?.engine?.ignitionStatus).toBe(true);
  });

  it('preserves unknown/extra fields in unflattened object without rejecting payload', () => {
    const rawExtraPayload = {
      ident: 'vehicle-001',
      timestamp: 123456789,
      'position.speed': 20,
      'engine.rpm': 1500,
      'hydraulic.pressure': 230,
      'payload.weight': 35.5,
      'new.future.field': 'future_value',
    };

    const unflattened = unflatten(rawExtraPayload);

    expect(unflattened.engine?.rpm).toBe(1500);
    expect(unflattened.hydraulic?.pressure).toBe(230);
    expect(unflattened.payload?.weight).toBe(35.5);
    expect(unflattened.new?.future?.field).toBe('future_value');

    const mapped = mapRawPayloadToStructured(rawExtraPayload);
    expect(mapped).not.toBeNull();
    expect(mapped?.ident).toBe('vehicle-001');
    expect(mapped?.position?.speed).toBe(20);
  });

  it('returns null if ident is missing or empty', () => {
    const invalidPayload = {
      timestamp: 123456,
      'position.speed': 20,
    };
    expect(mapRawPayloadToStructured(invalidPayload)).toBeNull();
  });

  it('handles missing, null, or optional fields without throwing errors', () => {
    const sparsePayload = {
      ident: 'vehicle-003',
      timestamp: 1787042687000,
      'position.latitude': null,
      'position.longitude': null,
      'position.speed': 25,
      'vehicle.mileage': undefined,
    };

    const mapped = mapRawPayloadToStructured(sparsePayload);

    expect(mapped).not.toBeNull();
    expect(mapped?.ident).toBe('vehicle-003');
    expect(mapped?.position?.speed).toBe(25);
    expect(mapped?.position?.latitude).toBeUndefined();
    expect(mapped?.vehicle?.mileage).toBeUndefined();
  });
});
