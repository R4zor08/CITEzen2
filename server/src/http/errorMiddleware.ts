import type { NextFunction, Request, Response } from 'express';
import { fail } from './apiResponse.js';
import { isHttpError } from './httpError.js';

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

  console.error(err);
  fail(res, 500, 'internal_error', 'Internal server error');
}
