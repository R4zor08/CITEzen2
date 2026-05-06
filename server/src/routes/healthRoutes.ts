import { Router } from 'express';
import * as controller from '../controllers/healthController.js';

export function healthRoutes() {
  const router = Router();
  router.get('/health', controller.health);
  return router;
}

