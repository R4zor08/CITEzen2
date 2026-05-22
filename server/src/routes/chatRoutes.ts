import { Router } from 'express';
import * as controller from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

const chatAuth = [requireAuth, requireRoles('student', 'staff', 'admin')] as const;

export function chatRoutes() {
  const router = Router();

  router.get('/api/chat/sessions', ...chatAuth, controller.listSessions);
  router.post('/api/chat/sessions', ...chatAuth, controller.createSessionHandler);
  router.post('/api/chat/sessions/import', ...chatAuth, controller.importSessions);
  router.get('/api/chat/sessions/:id/messages', ...chatAuth, controller.getSessionMessages);
  router.patch('/api/chat/sessions/:id', ...chatAuth, controller.patchSession);
  router.delete('/api/chat/sessions/:id', ...chatAuth, controller.deleteSessionHandler);
  router.post('/api/chat/stream', ...chatAuth, controller.streamChat);

  return router;
}
