export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return typeof e === 'object' && e !== null && 'status' in e && typeof (e as any).status === 'number';
}

