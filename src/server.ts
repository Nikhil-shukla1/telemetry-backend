import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocketIO } from './websocket/socket.js';

async function startServer() {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    initSocketIO(server);

    server.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 IoT Telemetry Platform Server running on port ${env.PORT}`);
      console.log(`📡 Ingest API Endpoint: http://localhost:${env.PORT}/api/ingest`);
      console.log(`📊 Vehicle API Endpoint: http://localhost:${env.PORT}/api/vehicles`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

