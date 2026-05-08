import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { updateUserRequestSchema, userIdParamSchema } from '../requests/userRequests.js';

export function userRoutes() {
  const router = Router();
  router.get('/api/users', requireAuth, requireRoles('admin'), controller.listUsers);
  router.patch(
    '/api/users/:id',
    requireAuth,
    validateParams(userIdParamSchema),
    validateBody(updateUserRequestSchema),
    controller.updateUser
  );
  return router;
}

