import type { NextFunction, Request, Response } from 'express';
import { ok } from '../http/apiResponse.js';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest
} from '../requests/authRequests.js';
import * as authService from '../services/authService.js';

/** Login: students use Student ID; staff/admin use email */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as LoginRequest;
    const result = await authService.login(body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as RegisterRequest;
    const result = await authService.register(body);
    ok(res, result, 201);
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as ForgotPasswordRequest;
    const result = await authService.requestPasswordReset(body.identifier);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as ResetPasswordRequest;
    const result = await authService.resetPassword(body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}


