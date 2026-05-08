import { Router } from 'express';
import * as controller from '../controllers/concernController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  addCommentRequestSchema,
  concernIdParamSchema,
  createConcernRequestSchema,
  forwardConcernRequestSchema,
  listConcernsQuerySchema,
  updateConcernRequestSchema
} from '../requests/concernRequests.js';

export function concernRoutes() {
  const router = Router();
  router.get(
    '/api/concerns',
    requireAuth,
    requireRoles('student', 'staff', 'admin'),
    validateQuery(listConcernsQuerySchema),
    controller.listConcerns
  );
  router.get(
    '/api/concerns/:id',
    requireAuth,
    requireRoles('student', 'staff', 'admin'),
    validateParams(concernIdParamSchema),
    controller.getConcern
  );
  router.post(
    '/api/concerns',
    requireAuth,
    requireRoles('student'),
    validateBody(createConcernRequestSchema),
    controller.createConcern
  );
  router.patch(
    '/api/concerns/:id',
    requireAuth,
    requireRoles('staff', 'admin'),
    validateParams(concernIdParamSchema),
    validateBody(updateConcernRequestSchema),
    controller.updateConcern
  );
  router.post(
    '/api/concerns/:id/comments',
    requireAuth,
    requireRoles('student', 'staff', 'admin'),
    validateParams(concernIdParamSchema),
    validateBody(addCommentRequestSchema),
    controller.addComment
  );
  router.post(
    '/api/concerns/:id/forward',
    requireAuth,
    requireRoles('staff', 'admin'),
    validateParams(concernIdParamSchema),
    validateBody(forwardConcernRequestSchema),
    controller.forwardConcern
  );
  return router;
}

