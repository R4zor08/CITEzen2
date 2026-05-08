import { Router } from 'express';
import * as controller from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

export function chatRoutes() {
  const router = Router();
  router.post('/api/chat/stream', requireAuth, requireRoles('student', 'staff', 'admin'), controller.streamChat);
  return router;
}

