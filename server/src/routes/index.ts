import type { Express } from 'express';
import { authRoutes } from './authRoutes.js';
import { chatRoutes } from './chatRoutes.js';
import { concernRoutes } from './concernRoutes.js';
import { healthRoutes } from './healthRoutes.js';
import { notificationRoutes } from './notificationRoutes.js';
import { userRoutes } from './userRoutes.js';

export function registerRoutes(app: Express) {
  app.use(healthRoutes());
  app.use(authRoutes());
  app.use(chatRoutes());
  app.use(userRoutes());
  app.use(concernRoutes());
  app.use(notificationRoutes());
}

