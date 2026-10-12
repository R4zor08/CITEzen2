import { Router } from 'express';
import * as controller from '../controllers/contactController.js';

export function contactRoutes() {
  const router = Router();
  router.post('/api/contact', controller.submitContact);
  router.get('/api/contact', controller.getContactMessages);
  router.patch('/api/contact/:id/read', controller.markContactRead);
  return router;
}
