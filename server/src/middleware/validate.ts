import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { fail } from '../http/apiResponse.js';

function toDetails(err: unknown) {
  const anyErr = err as { issues?: Array<{ path?: (string | number)[]; message?: string }> };
  return (anyErr.issues ?? []).map((i) => ({
    path: Array.isArray(i.path) ? i.path.join('.') : '',
    message: i.message ?? 'Invalid value'
  }));
}

function validatePart(
  selector: (req: Request) => unknown,
  assign: (req: Request, value: unknown) => void,
  schema: ZodTypeAny
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(selector(req));
    if (!parsed.success) {
      fail(res, 400, 'validation_error', 'Request validation failed', toDetails(parsed.error));
      return;
    }
    assign(req, parsed.data);
    next();
  };
}

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return validatePart(
    (req) => req.body,
    (req, value) => {
      req.body = value;
    },
    schema
  );
}

export function validateParams(schema: ZodTypeAny): RequestHandler {
  return validatePart(
    (req) => req.params,
    (req, value) => {
      req.params = value as Request['params'];
    },
    schema
  );
}

export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return validatePart(
    (req) => req.query,
    (req, value) => {
      (req as Request & { validatedQuery?: unknown }).validatedQuery = value;
    },
    schema
  );
}
