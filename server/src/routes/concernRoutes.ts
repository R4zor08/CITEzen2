import { Router } from 'express';
import * as controller from '../controllers/concernController.js';

export function concernRoutes() {
  const router = Router();
  router.get('/api/concerns', controller.listConcerns);
  router.get('/api/concerns/:id', controller.getConcern);
  router.post('/api/concerns', controller.createConcern);
  router.patch('/api/concerns/:id', controller.updateConcern);
  router.post('/api/concerns/:id/comments', controller.addComment);
  router.post('/api/concerns/:id/forward', controller.forwardConcern);
  return router;
}

