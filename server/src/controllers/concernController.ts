import type { NextFunction, Request, Response } from 'express';
import { ok } from '../http/apiResponse.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../http/httpError.js';
import { commentToApi, concernToApi } from '../mappers.js';
import type { ConcernAttachment, Role } from '../types.js';
import * as concernService from '../services/concernService.js';
import * as concernAttachmentService from '../services/concernAttachmentService.js';

export async function listConcerns(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.validatedQuery ?? req.query) as {
      studentId?: string;
      department?: string;
      assignedToId?: string;
      status?: string;
    };

    const list = await concernService.listConcerns({
      studentId: q.studentId,
      department: q.department,
      assignedToId: q.assignedToId,
      status: q.status
    });
    ok(res, list.map(concernToApi));
  } catch (e) {
    next(e);
  }
}

export async function getConcern(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await concernService.getConcern(req.params.id);
    if (!c) throw new NotFoundError('Concern not found');
    ok(res, concernToApi(c));
  } catch (e) {
    next(e);
  }
}

export async function verifyAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError('Authentication required');
    if (req.user.role !== 'student') {
      throw new ForbiddenError('Only students can verify concern attachments');
    }

    const b = req.body as { dataUrl: string; fileName: string; mimeType: string };
    const result = await concernAttachmentService.verifyAttachmentPayload(b);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function createConcern(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError('Authentication required');
    if (req.user.role !== 'student') throw new ForbiddenError('Only students can create concerns');
    const b = req.body as {
      title?: string;
      description?: string;
      category?: string;
      subcategory?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      studentId: string;
      studentName: string;
      department?: string;
      formData?: Record<string, unknown>;
      attachments?: ConcernAttachment[];
    };

    const r = await concernService.createConcern({
      ...b,
      // Always trust server-side auth context for ownership.
      studentId: req.user.id,
      studentName: req.user.name || b.studentName
    });
    if ('error' in r) {
      throw new BadRequestError(String(r.error ?? 'Invalid concern request'));
    }

    ok(res, concernToApi(r.concern), 201);
  } catch (e) {
    next(e);
  }
}

export async function updateConcern(req: Request, res: Response, next: NextFunction) {
  try {
    const concernId = req.params.id;
    if (!concernId) throw new BadRequestError('concern id is required');
    const b = req.body as Partial<{
      status: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      assignedTo: string | null;
      department: string;
    }>;

    const r = await concernService.updateConcern(concernId, b as any);
    if ('notFound' in r) {
      throw new NotFoundError('Concern not found');
    }
    ok(res, concernToApi(r.concern));
  } catch (e) {
    next(e);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError('Authentication required');
    const concernId = req.params.id;
    if (!concernId) throw new BadRequestError('concern id is required');
    const { content, visibleTo } = req.body as {
      content: string;
      visibleTo?: Role[];
    };

    const r = await concernService.addComment({
      concernId,
      content,
      authorId: req.user.id,
      visibleTo
    });

    if ('error' in r) {
      throw new BadRequestError(String(r.error ?? 'Invalid comment request'));
    }
    if ('notFound' in r) {
      throw new NotFoundError('Concern not found');
    }

    ok(res, commentToApi(r.comment), 201);
  } catch (e) {
    next(e);
  }
}

export async function forwardConcern(req: Request, res: Response, next: NextFunction) {
  try {
    const { department } = req.body as { department: string };

    const c = await concernService.forwardConcern(req.params.id, department);
    ok(res, concernToApi(c));
  } catch (e) {
    next(e);
  }
}

