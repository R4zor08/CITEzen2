import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../http/httpError.js';
import type { Role } from '../types.js';

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient role permissions'));
      return;
    }
    next();
  };
}
