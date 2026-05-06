import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userToApi } from '../mappers.js';
import type { Role } from '../types.js';
import { loginRequestSchema, registerRequestSchema } from '../requests/authRequests.js';
import * as users from '../repositories/userRepository.js';

/** Login: students use Student ID; staff/admin use email */
export async function login(req: Request, res: Response) {
  try {
    const parsed = loginRequestSchema.safeParse(req.body);
    const { identifier, password, role } = (parsed.success ? parsed.data : {}) as {
      identifier?: string;
      password?: string;
      role?: Role;
    };

    if (!identifier || !password || !role) {
      res.status(400).json({ error: 'identifier, password, and role are required' });
      return;
    }

    const user =
      role === 'student'
        ? await users.findUserForLogin({ identifier, role: 'student' })
        : await users.findUserForLogin({ identifier, role });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({
        error: 'Invalid credentials. Please check your Student ID/Email and password.'
      });
      return;
    }

    res.json({ user: userToApi(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerRequestSchema.safeParse(req.body);
    const body = (parsed.success ? parsed.data : {}) as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      studentId?: string;
      course?: string;
      department?: string;
    };

    const { name, password, role, studentId, course, department } = body;
    let { email } = body;

    if (!name || !password || !role) {
      res.status(400).json({ error: 'name, password, and role are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (role === 'student') {
      if (!studentId) {
        res.status(400).json({ error: 'Student ID is required for student accounts.' });
        return;
      }
      const dup = await users.findUserByStudentId(studentId);
      if (dup) {
        res.status(400).json({ error: 'An account with this Student ID already exists.' });
        return;
      }
      email = email?.trim() || `${studentId.toLowerCase().replace(/\s+/g, '')}@student.local`;
    } else {
      if (!email?.trim()) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }
      email = email.trim();
      const dup = await users.findUserByEmail(email);
      if (dup) {
        res.status(400).json({ error: 'An account with this email already exists.' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.createUser({
      name,
      email: email!,
      passwordHash,
      role,
      studentId: role === 'student' ? studentId : null,
      course: course ?? null,
      department: department ?? null
    } as any);

    res.status(201).json({ ok: true, userId: user.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
}

