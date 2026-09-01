import { Telemetry } from '../models/telemetry.js';
import { Vehicle } from '../models/vehicle.js';
import { generateMessageHash } from '../utils/hash.js';
import { mapRawPayloadToStructured } from '../utils/telemetryMapper.js';
import { emitTelemetryUpdate, broadcastVehiclesList } from '../websocket/socket.js';
import { getVehicleKpis } from './kpi.service.js';

export async function processTelemetryBatch(rawMessages: any[]) {
  const result = {
    received: Array.isArray(rawMessages) ? rawMessages.length : 0,
    stored: 0,
    duplicates: 0,
    rejected: 0,
    details: [] as any[],
  };

  if (!Array.isArray(rawMessages)) {
    result.rejected = rawMessages ? 1 : 0;
    return result;
  }

  for (const rawItem of rawMessages) {
    if (!rawItem || typeof rawItem !== 'object') {
      result.rejected++;
      result.details.push({ status: 'rejected', reason: 'Invalid JSON item' });
      continue;
    }

    const mapped = mapRawPayloadToStructured(rawItem);
    if (!mapped) {
      result.rejected++;
      result.details.push({ status: 'rejected', reason: 'Missing vehicle ident' });
      continue;
    }

    const { ident, timestamp, ...structuredData } = mapped;
    const messageHash = generateMessageHash(ident, timestamp, rawItem);

    try {
      const doc = new Telemetry({
        vehicleIdent: ident,
        timestamp,
        messageHash,
        ...structuredData,
        rawPayload: rawItem,
      });

      await doc.save();
      result.stored++;
      result.details.push({ ident, status: 'stored' });

      await Vehicle.findOneAndUpdate(
        { ident },
        { $set: { lastSeenAt: timestamp }, $setOnInsert: { name: `Vehicle ${ident}` } },
        { upsert: true }
      );

      // Emit real-time telemetry update for connected clients
      emitTelemetryUpdate(ident, {
        ident,
        timestamp: timestamp.toISOString(),
        ...structuredData,
      });
    } catch (err: any) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        result.duplicates++;
        result.details.push({ ident, status: 'duplicate' });
      } else {
        result.rejected++;
        result.details.push({ ident, status: 'rejected', reason: err.message });
      }
    }
  }

  if (result.stored > 0) {
    await broadcastVehiclesList();
  }

  return result;
}

