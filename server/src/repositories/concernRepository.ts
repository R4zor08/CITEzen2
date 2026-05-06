import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function listConcerns(where: Prisma.ConcernWhereInput) {
  return prisma.concern.findMany({
    where,
    include: { comments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getConcernById(id: string) {
  return prisma.concern.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: 'asc' } } }
  });
}

export async function getConcernLiteById(id: string) {
  return prisma.concern.findUnique({
    where: { id },
    select: { id: true, title: true, studentId: true, assignedToId: true }
  });
}

export async function createConcern(data: Prisma.ConcernCreateInput) {
  return prisma.concern.create({ data, include: { comments: true } });
}

export async function updateConcernById(id: string, data: Prisma.ConcernUpdateInput) {
  return prisma.concern.update({
    where: { id },
    data,
    include: { comments: { orderBy: { createdAt: 'asc' } } }
  });
}

export async function getConcernRawById(id: string) {
  return prisma.concern.findUnique({ where: { id } });
}

