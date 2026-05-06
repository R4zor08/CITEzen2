import { Router } from 'express';
import * as controller from '../controllers/chatController.js';

export function chatRoutes() {
  const router = Router();
  router.post('/api/chat/stream', controller.streamChat);
  return router;
}

