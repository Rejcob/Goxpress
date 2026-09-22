import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[node-stats-api] escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
});

/** Cierre ordenado: Docker envia SIGTERM al detener el contenedor. */
const shutdown = (signal) => {
  console.log(`[node-stats-api] ${signal} recibido, cerrando servidor...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
