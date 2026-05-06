import bcrypt from 'bcryptjs';
import * as users from '../repositories/userRepository.js';

export async function listUsers() {
  return users.listUsers();
}

export async function updateUser(args: { id: string; updates: any }) {
  const { id, updates } = args;
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.email !== undefined) data.email = updates.email;
  if (updates.department !== undefined) data.department = updates.department;
  if (updates.course !== undefined) data.course = updates.course;
  if (updates.profilePicture !== undefined) data.profilePicture = updates.profilePicture;
  if (updates.role !== undefined) {
    data.role = updates.role;
    if (updates.role !== 'student') {
      data.studentId = null;
    }
  }
  if (updates.studentId !== undefined) {
    data.studentId =
      updates.studentId && String(updates.studentId).trim() ? String(updates.studentId).trim() : null;
  }
  if (updates.password && updates.password.length >= 6) {
    data.passwordHash = await bcrypt.hash(updates.password, 10);
  }
  return users.updateUserById(id, data);
}

