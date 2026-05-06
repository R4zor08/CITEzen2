import bcrypt from 'bcryptjs';
import type { Role } from '../types.js';
import * as users from '../repositories/userRepository.js';

export async function login(args: { identifier: string; password: string; role: Role }) {
  const user = await users.findUserForLogin({ identifier: args.identifier, role: args.role });
  if (!user) return null;
  const ok = await bcrypt.compare(args.password, user.passwordHash);
  if (!ok) return null;
  return user;
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
  const passwordHash = await bcrypt.hash(args.password, 10);

  const isStudent = args.role === 'student';
  const studentId = isStudent ? args.studentId ?? null : null;

  return users.createUser({
    name: args.name,
    email: (args.email ?? '') as any,
    passwordHash,
    role: args.role,
    studentId,
    course: args.course ?? null,
    department: args.department ?? null
  });
}

