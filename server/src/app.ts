import cors from 'cors';
import express from 'express';
import { corsOriginOption } from './http/corsOriginOption.js';
import { registerRoutes } from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: corsOriginOption() }));
  // Default 100kb is too small for profile avatars stored as base64 data URLs
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '15mb' }));

  registerRoutes(app);
  return app;
}

