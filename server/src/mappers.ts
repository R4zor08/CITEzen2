import type {
  Comment as PrismaComment,
  Concern as PrismaConcern,
  User as PrismaUser,
  Notification as PrismaNotification
} from '@prisma/client';

type Role = 'student' | 'staff' | 'admin';

function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function statusToApi(s: string): 'pending' | 'in-progress' | 'resolved' | 'rejected' {
  if (s === 'in_progress') return 'in-progress';
  if (s === 'pending' || s === 'resolved' || s === 'rejected') return s;
  return 'pending';
}

export function statusFromApi(s: string): string {
  if (s === 'in-progress') return 'in_progress';
  return s;
}

export function userToApi(u: PrismaUser) {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

export function commentToApi(c: PrismaComment) {
  return {
    id: c.id,
    author: c.authorName,
    authorRole: c.authorRole as Role,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    visibleTo: parseJson<Role[]>(c.visibleTo, ['student', 'staff', 'admin'])
  };
}

export function concernToApi(c: PrismaConcern & { comments: PrismaComment[] }) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    subcategory: c.subcategory,
    status: statusToApi(c.status),
    priority: c.priority as 'low' | 'medium' | 'high' | 'urgent',
    studentId: c.studentId,
    studentName: c.studentName,
    assignedTo: c.assignedToId ?? undefined,
    department: c.department,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    attachments: parseJson<string[] | undefined>(c.attachments ?? null, undefined),
    formData: parseJson<Record<string, unknown> | undefined>(c.formData ?? null, undefined),
    comments: c.comments.map(commentToApi)
  };
}

export function notificationToApi(n: PrismaNotification) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    type: n.type,
    concernId: n.concernId ?? undefined
  };
}
