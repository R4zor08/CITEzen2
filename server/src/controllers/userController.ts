import type { Request, Response } from 'express';
import { userToApi } from '../mappers.js';
import { updateUserRequestSchema } from '../requests/userRequests.js';
import * as userService from '../services/userService.js';

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await userService.listUsers();
    res.json(users.map(userToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parsed = updateUserRequestSchema.safeParse(req.body);
    const updates = (parsed.success ? parsed.data : {}) as any;

    const user = await userService.updateUser({ id, updates });
    res.json(userToApi(user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

