import type { NextFunction, Request, Response } from 'express';
import { ok } from '../http/apiResponse.js';
import { ForbiddenError } from '../http/httpError.js';
import { userToApi } from '../mappers.js';
import * as userService from '../services/userService.js';

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.listUsers();
    ok(res, users.map(userToApi));
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError('Authentication required');
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }
    const updates = req.body as Record<string, unknown>;

    const user = await userService.updateUser({ id, updates });
    ok(res, userToApi(user));
  } catch (e) {
    next(e);
  }
}

