import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../http/httpError.js';
import type { AuthUser, Role } from '../types.js';

type AuthJwtPayload = {
  sub: string;
  role: Role;
  email: string;
  name: string;
  studentId?: string;
  iat?: number;
  exp?: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return secret as Secret;
}

export function signAuthToken(user: AuthUser) {
  const payload: AuthJwtPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    ...(user.studentId ? { studentId: user.studentId } : {})
  };
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || '7d';
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn']
  };
  return jwt.sign(payload, getJwtSecret(), options);
}

function readBearerToken(req: Request) {
  const header = req.header('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readBearerToken(req);
    if (!token) throw new UnauthorizedError('Missing bearer token');

    const payload = jwt.verify(token, getJwtSecret()) as AuthJwtPayload;
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      ...(payload.studentId ? { studentId: payload.studentId } : {})
    };
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError('Invalid token'));
  }
}
