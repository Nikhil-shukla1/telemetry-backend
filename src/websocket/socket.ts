import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { Vehicle } from '../models/vehicle.js';
import { getVehicleKpis } from '../services/kpi.service.js';
import { processTelemetryBatch } from '../services/telemetry.service.js';

let io: Server | null = null;

export async function broadcastVehiclesList(): Promise<void> {
  if (!io) return;
  try {
    const vehicles = await Vehicle.find().sort({ lastSeenAt: -1 }).lean();
    io.emit('vehicles:list', vehicles);
    io.emit('vehicles', vehicles);
  } catch (error) {
    console.error('[Socket.IO] Error broadcasting vehicles list:', error);
  }
}

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Fetch and send vehicle list over socket
    const sendVehicles = async () => {
      try {
        const vehicles = await Vehicle.find().sort({ lastSeenAt: -1 }).lean();
        socket.emit('vehicles:list', vehicles);
        socket.emit('vehicles', vehicles);
      } catch (error) {
        console.error(`[Socket.IO] Error sending vehicles to ${socket.id}:`, error);
        socket.emit('error', { message: 'Failed to fetch vehicles over socket' });
      }
    };

    // Auto-send vehicle list on initial connection
    sendVehicles();

    socket.on('get:vehicles', sendVehicles);
    socket.on('vehicles:get', sendVehicles);
    socket.on('request:vehicles', sendVehicles);

    // Fetch and send KPI data over socket
    const handleGetKpis = async (payload: { vehicleIdent?: string; from?: string; to?: string } | string) => {
      try {
        let vehicleIdent = '';
        let fromStr: string | undefined;
        let toStr: string | undefined;

        if (typeof payload === 'string') {
          vehicleIdent = payload;
        } else if (payload && typeof payload === 'object') {
          vehicleIdent = payload.vehicleIdent || '';
          fromStr = payload.from;
          toStr = payload.to;
        }

        if (!vehicleIdent) {
          socket.emit('error', { message: 'vehicleIdent is required for get:kpis' });
          return;
        }

        const fromDate = fromStr ? new Date(fromStr) : undefined;
        const toDate = toStr ? new Date(toStr) : undefined;

        const kpiData = await getVehicleKpis(vehicleIdent, fromDate, toDate);
        socket.emit('vehicle:kpis', kpiData);
        socket.emit('kpis:data', kpiData);
        socket.emit('kpis', kpiData);
      } catch (error: any) {
        console.error(`[Socket.IO] Error fetching KPIs for client ${socket.id}:`, error);
        socket.emit('error', { message: error.message || 'Failed to fetch KPIs over socket' });
      }
    };

    socket.on('get:kpis', handleGetKpis);
    socket.on('kpis:get', handleGetKpis);
    socket.on('request:kpis', handleGetKpis);

    // Ingest telemetry batch over socket
    socket.on('telemetry:ingest', async (rawBatch: any[], ack?: (res: any) => void) => {
      try {
        if (!Array.isArray(rawBatch)) {
          const errRes = { error: 'BadRequest', message: 'Payload must be an array of telemetry objects' };
          if (ack) ack(errRes);
          socket.emit('telemetry:ingest:response', errRes);
          return;
        }

        const batchResult = await processTelemetryBatch(rawBatch);

        // Broadcast updated vehicles list if storing new telemetry created/updated vehicles
        if (batchResult.stored > 0) {
          await broadcastVehiclesList();
        }

        if (ack) ack({ status: 'ok', result: batchResult });
        socket.emit('telemetry:ingest:response', { status: 'ok', result: batchResult });
      } catch (error: any) {
        console.error(`[Socket.IO] Ingest error for client ${socket.id}:`, error);
        const errRes = { error: 'IngestError', message: error.message };
        if (ack) ack(errRes);
        socket.emit('telemetry:ingest:response', errRes);
      }
    });

    socket.on('subscribe:vehicle', (vehicleIdent: string) => {
      if (vehicleIdent) {
        socket.join(`vehicle:${vehicleIdent}`);
        console.log(`[Socket.IO] Client ${socket.id} joined room: vehicle:${vehicleIdent}`);
      }
    });

    socket.on('unsubscribe:vehicle', (vehicleIdent: string) => {
      if (vehicleIdent) {
        socket.leave(`vehicle:${vehicleIdent}`);
        console.log(`[Socket.IO] Client ${socket.id} left room: vehicle:${vehicleIdent}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketIO(): Server | null {
  return io;
}

export function emitTelemetryUpdate(vehicleIdent: string, data: any): void {
  if (!io) return;
  // Send to frontend global topic as well as specific vehicle room
  io.emit('telemetry:new', { vehicleIdent, telemetry: data, kpis: data.kpis });
  io.to(`vehicle:${vehicleIdent}`).emit('vehicle:telemetry', { vehicleIdent, telemetry: data, kpis: data.kpis });
}

