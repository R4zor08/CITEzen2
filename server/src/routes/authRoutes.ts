import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import {
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema
} from '../requests/authRequests.js';

export function authRoutes() {
  const router = Router();
  router.post('/api/auth/login', validateBody(loginRequestSchema), controller.login);
  router.post('/api/auth/register', validateBody(registerRequestSchema), controller.register);
  router.post('/api/auth/forgot-password', validateBody(forgotPasswordRequestSchema), controller.forgotPassword);
  router.post('/api/auth/reset-password', validateBody(resetPasswordRequestSchema), controller.resetPassword);
  return router;
}

