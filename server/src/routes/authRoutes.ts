import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import { loginRequestSchema, registerRequestSchema } from '../requests/authRequests.js';

export function authRoutes() {
  const router = Router();
  router.post('/api/auth/login', validateBody(loginRequestSchema), controller.login);
  router.post('/api/auth/register', validateBody(registerRequestSchema), controller.register);
  return router;
}

