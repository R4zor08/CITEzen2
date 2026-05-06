import type { Prisma, User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function findUserForLogin(args: { role: 'student' | 'staff' | 'admin'; identifier: string }) {
  const { role, identifier } = args;
  return role === 'student'
    ? prisma.user.findFirst({ where: { studentId: identifier, role: 'student' } })
    : prisma.user.findFirst({ where: { email: identifier, role } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByStudentId(studentId: string) {
  return prisma.user.findFirst({ where: { studentId } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email } });
}

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

export async function updateUserById(id: string, data: Prisma.UserUpdateInput): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

