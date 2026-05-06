import { Router } from 'express';
import * as controller from '../controllers/userController.js';

export function userRoutes() {
  const router = Router();
  router.get('/api/users', controller.listUsers);
  router.patch('/api/users/:id', controller.updateUser);
  return router;
}

