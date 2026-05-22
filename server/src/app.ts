import cors from 'cors';
import express from 'express';
import { corsOriginOption } from './http/corsOriginOption.js';
import { fail } from './http/apiResponse.js';
import { errorMiddleware } from './http/errorMiddleware.js';
import { registerRoutes } from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: corsOriginOption() }));
  // Default 100kb is too small for profile avatars stored as base64 data URLs
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT ?? '15mb' }));

  registerRoutes(app);
  app.use((_req, res) => {
    fail(res, 404, 'not_found', 'Route not found');
  });
  app.use(errorMiddleware);
  return app;
}

