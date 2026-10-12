import bcrypt from 'bcryptjs';
import { signAuthToken } from '../middleware/auth.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../http/httpError.js';
import { userToApi } from '../mappers.js';
import type { Role } from '../types.js';
import * as users from '../repositories/userRepository.js';
import { sendPasswordResetOtpEmail } from './emailService.js';

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
      throw new BadRequestError('Student ID is required for student accounts.');
    }
    if (!email) {
      throw new BadRequestError('NEMSU email is required for student accounts.');
    }
    email = email.toLowerCase();
    if (!/^[^\s@]+@nemsu\.edu\.ph$/i.test(email)) {
      throw new BadRequestError('Use your official NEMSU email (e.g. name@nemsu.edu.ph).');
    }
    const dupId = await users.findUserByStudentId(args.studentId);
    if (dupId) throw new ConflictError('An account with this Student ID already exists.');
    const dupEmail = await users.findUserByEmail(email);
    if (dupEmail) throw new ConflictError('An account with this email already exists.');
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

export async function requestPasswordReset(identifier: string) {
  const user = await users.findUserByIdentifier(identifier);
  if (!user) {
    throw new NotFoundError('No account found matching this Student ID or Email.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.resetPasswordOtp = otp;
  user.resetPasswordExpires = expires;
  await user.save();

  await sendPasswordResetOtpEmail({
    recipientEmail: user.email,
    recipientName: user.name || 'CITEzen User',
    otpCode: otp
  });

  const parts = user.email.split('@');
  const prefix = parts[0] || '';
  const domain = parts[1] || '';
  const maskedName =
    prefix.length <= 2
      ? prefix[0] + '*'
      : prefix[0] + '*'.repeat(Math.max(1, prefix.length - 2)) + prefix.slice(-1);
  const maskedEmail = `${maskedName}@${domain}`;

  return {
    ok: true,
    maskedEmail,
    message: `A 6-digit verification code has been sent to ${maskedEmail}.`
  };
}

export async function resetPassword(args: {
  identifier: string;
  otp: string;
  newPassword: string;
}) {
  if (!args.newPassword || args.newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters long.');
  }

  const user = await users.findUserByIdentifier(args.identifier);
  if (!user) {
    throw new NotFoundError('No account found matching this Student ID or Email.');
  }

  if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
    throw new BadRequestError('No active password reset request found. Please request a new code.');
  }

  if (new Date() > new Date(user.resetPasswordExpires)) {
    throw new BadRequestError('The verification code has expired. Please request a new code.');
  }

  if (user.resetPasswordOtp.trim() !== args.otp.trim()) {
    throw new BadRequestError('Invalid verification code. Please check your inbox.');
  }

  const newPasswordHash = await bcrypt.hash(args.newPassword, 10);
  user.passwordHash = newPasswordHash;
  user.resetPasswordOtp = null;
  user.resetPasswordExpires = null;
  await user.save();

  return {
    ok: true,
    message: 'Your password has been reset successfully! You can now sign in.'
  };
}


