import type { NextFunction, Request, Response } from 'express';
import { fail } from './apiResponse.js';
import { isHttpError } from './httpError.js';

function mongoDuplicateKeyMessage(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  const e = err as { code?: number; keyPattern?: Record<string, number | string> };
  if (e.code !== 11000) return null;
  const keys = e.keyPattern ? Object.keys(e.keyPattern) : [];
  if (keys.includes('email')) return 'An account with this email already exists.';
  if (keys.includes('studentId')) return 'An account with this Student ID already exists.';
  return 'This record conflicts with an existing account.';
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) return;

  if (isHttpError(err)) {
    fail(res, err.status, err.code, err.message, err.details);
    return;
  }

  const dupMsg = mongoDuplicateKeyMessage(err);
  if (dupMsg) {
    fail(res, 409, 'conflict', dupMsg);
    return;
  }

  console.error(err);
  fail(res, 500, 'internal_error', 'Internal server error');
}
