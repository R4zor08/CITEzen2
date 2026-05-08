export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, 'bad_request', message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, 'unauthorized', message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have permission to access this resource') {
    super(403, 'forbidden', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, 'not_found', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, 'conflict', message);
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status?: unknown }).status === 'number' &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}
