import express from 'express';

import { config } from './config.js';
import { healthRouter } from './routes/health.routes.js';
import { statsRouter } from './routes/stats.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { requestLogger } from './middlewares/requestLogger.js';

/**
 * Construye la app.
 *
 * Se exporta como factory para que los
 * tests puedan levantar la app sin ocupar un puerto fijo.
 */
export const createApp = () => {
  const app = express();

  app.set('trust proxy', 'loopback');
  
  app.use(requestLogger);
  app.use(express.json({ limit: config.bodyLimit }));

  app.use(healthRouter);
  app.use(statsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
