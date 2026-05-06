import { Router } from 'express';
import * as controller from '../controllers/authController.js';

export function authRoutes() {
  const router = Router();
  router.post('/api/auth/login', controller.login);
  router.post('/api/auth/register', controller.register);
  return router;
}

