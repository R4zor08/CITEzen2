import type { Response } from 'express';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>) {
  const payload: ApiSuccess<T> = meta
    ? { success: true, data, meta }
    : { success: true, data };
  return res.status(status).json(payload);
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const payload: ApiFailure = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) }
  };
  return res.status(status).json(payload);
}
