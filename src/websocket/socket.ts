import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

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
  // it will send to the frontend global topic as well as specific vehicle room
  io.emit('telemetry:new', { vehicleIdent, telemetry: data });
  io.to(`vehicle:${vehicleIdent}`).emit('vehicle:telemetry', { vehicleIdent, telemetry: data });
}
