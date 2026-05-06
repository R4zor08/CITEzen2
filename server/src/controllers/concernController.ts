import type { Request, Response } from 'express';
import { commentToApi, concernToApi } from '../mappers.js';
import { addCommentRequestSchema, createConcernRequestSchema, forwardConcernRequestSchema, updateConcernRequestSchema } from '../requests/concernRequests.js';
import type { Role } from '../types.js';
import * as concernService from '../services/concernService.js';

export async function listConcerns(req: Request, res: Response) {
  try {
    const { studentId, department, assignedToId, status } = req.query;

    const list = await concernService.listConcerns({
      studentId: typeof studentId === 'string' ? studentId : undefined,
      department: typeof department === 'string' ? department : undefined,
      assignedToId: typeof assignedToId === 'string' ? assignedToId : undefined,
      status: typeof status === 'string' ? status : undefined
    });
    res.json(list.map(concernToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list concerns' });
  }
}

export async function getConcern(req: Request, res: Response) {
  try {
    const c = await concernService.getConcern(req.params.id);
    if (!c) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(concernToApi(c));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load concern' });
  }
}

export async function createConcern(req: Request, res: Response) {
  try {
    const parsed = createConcernRequestSchema.safeParse(req.body);
    const b = (parsed.success ? parsed.data : {}) as any;

    if (!b.studentId || !b.studentName) {
      res.status(400).json({ error: 'studentId and studentName are required' });
      return;
    }

    const r = await concernService.createConcern(b);
    if ('error' in r) {
      res.status(400).json({ error: r.error });
      return;
    }

    res.status(201).json(concernToApi(r.concern));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create concern' });
  }
}

export async function updateConcern(req: Request, res: Response) {
  try {
    const parsed = updateConcernRequestSchema.safeParse(req.body);
    const b = (parsed.success ? parsed.data : {}) as Partial<{
      status: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      assignedTo: string | null;
      department: string;
    }>;

    const r = await concernService.updateConcern(req.params.id, b as any);
    if ('notFound' in r) {
      res.status(404).json({ error: 'Concern not found' });
      return;
    }
    res.json(concernToApi(r.concern));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update concern' });
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const parsed = addCommentRequestSchema.safeParse(req.body);
    const { content, authorId, visibleTo } = (parsed.success ? parsed.data : {}) as {
      content?: string;
      authorId?: string;
      visibleTo?: Role[];
    };

    if (!content?.trim() || !authorId) {
      res.status(400).json({ error: 'content and authorId are required' });
      return;
    }

    const r = await concernService.addComment({
      concernId: req.params.id,
      content,
      authorId,
      visibleTo
    });

    if ('error' in r) {
      res.status(400).json({ error: r.error });
      return;
    }
    if ('notFound' in r) {
      res.status(404).json({ error: 'Concern not found' });
      return;
    }

    res.status(201).json(commentToApi(r.comment));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export async function forwardConcern(req: Request, res: Response) {
  try {
    const parsed = forwardConcernRequestSchema.safeParse(req.body);
    const { department } = (parsed.success ? parsed.data : {}) as { department?: string };
    if (!department?.trim()) {
      res.status(400).json({ error: 'department is required' });
      return;
    }

    const c = await concernService.forwardConcern(req.params.id, department);
    res.json(concernToApi(c));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to forward concern' });
  }
}

