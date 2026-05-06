import type { Request, Response } from 'express';
import { notificationToApi } from '../mappers.js';
import { markAllReadRequestSchema } from '../requests/notificationRequests.js';
import * as notificationService from '../services/notificationService.js';

export async function listNotifications(req: Request, res: Response) {
  try {
    const userId = req.query.userId;
    if (typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query param is required' });
      return;
    }

    const list = await notificationService.listNotifications(userId);
    res.json(list.map(notificationToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    const n = await notificationService.markRead(req.params.id);
    res.json(notificationToApi(n));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    const parsed = markAllReadRequestSchema.safeParse(req.body);
    const { userId } = (parsed.success ? parsed.data : {}) as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    await notificationService.markAllRead(userId);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
}

export async function clearNotifications(req: Request, res: Response) {
  try {
    const userId = req.query.userId;
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'userId query param is required' });
      return;
    }
    const r = await notificationService.clear(userId);
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
}

