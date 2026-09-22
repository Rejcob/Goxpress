import { Router } from 'express';

export const healthRouter = Router();

/**
 * GET /health
 *
 * Endpoint de verificacion usado por Docker y por el reverse proxy para
 * confirmar que el servicio esta arriba.
 */
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'node-stats-api', uptime: process.uptime() });
});
