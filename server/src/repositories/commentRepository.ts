import { prisma } from '../lib/prisma.js';

export async function createComment(data: {
  concernId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  visibleTo: string;
}) {
  return prisma.comment.create({ data });
}

