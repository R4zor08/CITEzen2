import { Router } from 'express';
import * as controller from '../controllers/notificationController.js';

export function notificationRoutes() {
  const router = Router();
  router.get('/api/notifications', controller.listNotifications);
  router.patch('/api/notifications/:id/read', controller.markRead);
  router.post('/api/notifications/mark-all-read', controller.markAllRead);
  router.delete('/api/notifications', controller.clearNotifications);
  return router;
}

