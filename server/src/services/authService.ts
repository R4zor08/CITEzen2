import bcrypt from 'bcryptjs';
import { signAuthToken } from '../middleware/auth.js';
import { ConflictError, UnauthorizedError } from '../http/httpError.js';
import { userToApi } from '../mappers.js';
import type { Role } from '../types.js';
import * as users from '../repositories/userRepository.js';

export async function login(args: { identifier: string; password: string; role: Role }) {
  const identifier =
    args.role === 'student' ? args.identifier.trim() : args.identifier.trim().toLowerCase();
  const user = await users.findUserForLogin({ identifier, role: args.role });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials. Please check your Student ID/Email and password.');
  }
  const ok = await bcrypt.compare(args.password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid credentials. Please check your Student ID/Email and password.');
  }
  const apiUser = userToApi(user);
  const token = signAuthToken({
    id: apiUser.id,
    role: apiUser.role,
    email: apiUser.email,
    name: apiUser.name,
    ...(apiUser.studentId ? { studentId: apiUser.studentId } : {})
  });
  return { user: apiUser, token };
}

export async function register(args: {
  name: string;
  email?: string;
  password: string;
  role: Role;
  studentId?: string;
  course?: string;
  department?: string;
}) {
  let email = args.email?.trim();

  if (args.role === 'student') {
    if (!args.studentId) {
      throw new ConflictError('Student ID is required for student accounts.');
    }
    const dup = await users.findUserByStudentId(args.studentId);
    if (dup) throw new ConflictError('An account with this Student ID already exists.');
    email = email || `${args.studentId.toLowerCase().replace(/\s+/g, '')}@student.local`;
  } else {
    if (!email) throw new ConflictError('Email is required.');
    email = email.toLowerCase();
    const dup = await users.findUserByEmail(email);
    if (dup) throw new ConflictError('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(args.password, 10);

  const isStudent = args.role === 'student';

  // Multiple staff/admin docs must NOT store studentId: null — MongoDB unique+sparse still indexes null,
  // causing duplicate key errors on the second registration. Omit the field entirely for non-students.
  const baseUser = {
    name: args.name,
    email: email!,
    passwordHash,
    role: args.role,
    course: args.course ?? null,
    department: args.department ?? null
  };
  const created = await users.createUser(
    isStudent ? { ...baseUser, studentId: args.studentId! } : baseUser
  );
  return { userId: created.id };
}

