import { Router } from 'express';
import { postStats } from '../controllers/stats.controller.js';

export const statsRouter = Router();

statsRouter.post('/stats', postStats);
