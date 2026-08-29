import { describe, it, expect } from 'vitest';
import {
  calculateAverageSpeed,
  calculateTotalDistance,
  calculateTotalFuelUsed,
  extractGpsTrack,
} from '../src/services/kpi.service.js';

describe('KPI Service Unit Tests', () => {
  describe('Average Speed Calculation', () => {
    it('calculates arithmetic mean of valid speeds correctly', () => {
      const items = [
        { position: { speed: 10 } },
        { position: { speed: 20 } },
        { position: { speed: 30 } },
      ];
      expect(calculateAverageSpeed(items)).toBe(20);
    });

    it('ignores null, undefined, non-numeric, or negative speeds', () => {
      const items = [
        { position: { speed: 10 } },
        { position: { speed: null as any } },
        { position: { speed: undefined } },
        { position: { speed: -5 } },
        { position: { speed: NaN } },
        { position: { speed: 30 } },
      ];
      expect(calculateAverageSpeed(items)).toBe(20);
    });

    it('returns 0 if no valid speed samples are present', () => {
      const items = [{ position: {} }, { position: { speed: null as any } }];
      expect(calculateAverageSpeed(items)).toBe(0);
    });
  });

  describe('Total Distance Calculation (Cumulative Mileage)', () => {
    it('calculates distance from normal increasing cumulative mileage counter', () => {
      const items = [
        { vehicle: { mileage: 92400.461 } },
        { vehicle: { mileage: 92405.000 } },
        { vehicle: { mileage: 92412.781 } },
      ];
      expect(calculateTotalDistance(items)).toBe(12.32);
    });

    it('handles duplicate telemetry readings without accumulating duplicate distance', () => {
      const items = [
        { vehicle: { mileage: 100 } },
        { vehicle: { mileage: 100 } },
        { vehicle: { mileage: 105 } },
      ];
      expect(calculateTotalDistance(items)).toBe(5);
    });

    it('handles missing or null mileage readings seamlessly', () => {
      const items = [
        { vehicle: { mileage: 100 } },
        { vehicle: {} },
        { vehicle: { mileage: null as any } },
        { vehicle: { mileage: 110 } },
      ];
      expect(calculateTotalDistance(items)).toBe(10);
    });

    it('handles counter decreases and resets without returning negative distance', () => {
      const items = [
        { vehicle: { mileage: 100 } },
        { vehicle: { mileage: 120 } }, // +20
        { vehicle: { mileage: 10 } },  // Counter reset, ignored delta
        { vehicle: { mileage: 25 } },  // +15
      ];
      // Total should be (120 - 100) + (25 - 10) = 20 + 15 = 35
      expect(calculateTotalDistance(items)).toBe(35);
    });

    it('returns 0 if fewer than 2 valid mileage readings exist', () => {
      expect(calculateTotalDistance([{ vehicle: { mileage: 100 } }])).toBe(0);
      expect(calculateTotalDistance([])).toBe(0);
    });
  });

  describe('Total Fuel Used Calculation (Cumulative Fuel Counter)', () => {
    it('calculates fuel used from normal cumulative fuel counter', () => {
      const items = [
        { engine: { totalFuelUsed: 18342.5 } },
        { engine: { totalFuelUsed: 18345.0 } },
        { engine: { totalFuelUsed: 18348.7 } },
      ];
      expect(calculateTotalFuelUsed(items)).toBe(6.2);
    });

    it('handles missing and null fuel values safely', () => {
      const items = [
        { engine: { totalFuelUsed: 100 } },
        { engine: {} },
        { engine: { totalFuelUsed: 108.5 } },
      ];
      expect(calculateTotalFuelUsed(items)).toBe(8.5);
    });

    it('handles fuel counter resets without returning negative consumption', () => {
      const items = [
        { engine: { totalFuelUsed: 500 } },
        { engine: { totalFuelUsed: 520 } }, // +20
        { engine: { totalFuelUsed: 5 } },   // Reset, delta <= 0 ignored
        { engine: { totalFuelUsed: 15 } },  // +10
      ];
      expect(calculateTotalFuelUsed(items)).toBe(30);
    });
  });

  describe('GPS Track Extraction', () => {
    it('includes valid GPS fixes (position.valid = true) and excludes invalid fixes', () => {
      const now = new Date('2026-08-28T08:00:00Z');
      const items = [
        {
          timestamp: now,
          position: { latitude: 22.051, longitude: 83.719, valid: true },
        },
        {
          timestamp: new Date(now.getTime() + 1000),
          position: { latitude: 22.052, longitude: 83.720, valid: false }, // Should be excluded
        },
        {
          timestamp: new Date(now.getTime() + 2000),
          position: { latitude: 22.053, longitude: 83.721, valid: true },
        },
      ];

      const track = extractGpsTrack(items);

      expect(track).toHaveLength(2);
      expect(track[0]).toEqual({
        latitude: 22.051,
        longitude: 83.719,
        altitude: undefined,
        speed: undefined,
        timestamp: '2026-08-28T08:00:00.000Z',
      });
      expect(track[1].latitude).toBe(22.053);
    });

    it('filters out invalid coordinate ranges', () => {
      const items = [
        {
          timestamp: new Date(),
          position: { latitude: 1000, longitude: 83.719, valid: true }, // Out of range latitude
        },
      ];
      expect(extractGpsTrack(items)).toHaveLength(0);
    });
  });
});
