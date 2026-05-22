import type { ConcernAttachment, Priority, Role } from '../types.js';
import { statusFromApi } from '../mappers.js';
import { validateAttachmentsForCreate } from './concernAttachmentService.js';
import * as concerns from '../repositories/concernRepository.js';
import * as users from '../repositories/userRepository.js';
import * as comments from '../repositories/commentRepository.js';
import * as notifications from '../repositories/notificationRepository.js';

export async function listConcerns(filters: {
  studentId?: string;
  department?: string;
  assignedToId?: string;
  status?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.department) where.department = filters.department;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.status) where.status = statusFromApi(filters.status);
  return concerns.listConcerns(where);
}

export async function getConcern(id: string) {
  return concerns.getConcernById(id);
}

export async function createConcern(args: {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  priority?: Priority;
  studentId: string;
  studentName: string;
  department?: string;
  formData?: Record<string, unknown>;
  attachments?: ConcernAttachment[];
}) {
  const student = await users.findUserById(args.studentId);
  if (!student) return { error: 'Student user not found' as const };

  const attachmentCheck = await validateAttachmentsForCreate(args.attachments);
  if ('error' in attachmentCheck) {
    return { error: attachmentCheck.error } as const;
  }

  const c = await concerns.createConcern({
    title: args.title ?? 'Untitled Concern',
    description: args.description ?? '',
    category: args.category ?? 'General',
    subcategory: args.subcategory ?? 'General',
    priority: args.priority ?? 'medium',
    studentId: args.studentId,
    studentName: args.studentName,
    department: args.department ?? 'Administration',
    formData: args.formData !== undefined ? JSON.stringify(args.formData) : null,
    attachments: args.attachments !== undefined ? JSON.stringify(args.attachments) : null
  });

  await notifications.createNotification({
    userId: args.studentId,
    title: 'Concern Submitted',
    message: `Your concern "${c.title}" has been routed to ${c.department}.`,
    type: 'system',
    concernId: c.id
  });

  const attachmentCount = args.attachments?.length ?? 0;
  const attachmentNote =
    attachmentCount > 0
      ? ` (${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''})`
      : '';

  const [admins, staff] = await Promise.all([
    users.findUsersByRole('admin'),
    users.findStaffByDepartment(c.department)
  ]);

  const notifyIds = new Set<string>();
  for (const u of [...admins, ...staff]) {
    const anyU = u as { id?: string; _id?: { toString(): string } };
    const userId = anyU.id ?? anyU._id?.toString();
    if (!userId || notifyIds.has(userId)) continue;
    notifyIds.add(userId);
    await notifications.createNotification({
      userId,
      title: 'New Concern Submitted',
      message: `${args.studentName} submitted "${c.title}" routed to ${c.department}${attachmentNote}.`,
      type: 'system',
      concernId: c.id
    });
  }

  return { concern: c } as const;
}

export async function updateConcern(
  id: string,
  b: Partial<{ status: string; priority: Priority; assignedTo: string | null; department: string }>
) {
  const prev = await concerns.getConcernLiteById(id);
  if (!prev) return { notFound: true as const };

  const data: Record<string, unknown> = {};
  if (b.status !== undefined) data.status = statusFromApi(b.status);
  if (b.priority !== undefined) data.priority = b.priority;
  if (b.department !== undefined) data.department = b.department;
  if (b.assignedTo !== undefined) data.assignedToId = b.assignedTo;

  const c = await concerns.updateConcernById(id, data as any);

  if (b.status !== undefined) {
    await notifications.createNotification({
      userId: c.studentId,
      title: 'Status Updated',
      message: `Your concern "${c.title}" is now ${b.status.replace(/-/g, ' ')}.`,
      type: 'status_change',
      concernId: c.id
    });
  }

  if (b.assignedTo !== undefined && b.assignedTo !== prev.assignedToId) {
    if (b.assignedTo) {
      await notifications.createNotification({
        userId: b.assignedTo,
        title: 'New Assignment',
        message: `You have been assigned "${c.title}".`,
        type: 'assignment',
        concernId: c.id
      });
    }
  }

  return { concern: c } as const;
}

export async function addComment(args: {
  concernId: string;
  content: string;
  authorId: string;
  visibleTo?: Role[];
}) {
  const author = await users.findUserById(args.authorId);
  if (!author) return { error: 'Author not found' as const };

  const concern = await concerns.getConcernRawById(args.concernId);
  if (!concern) return { notFound: true as const };

  const comment = await comments.createComment({
    concernId: concern.id,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    content: args.content.trim(),
    visibleTo: JSON.stringify(args.visibleTo ?? ['student', 'staff', 'admin'])
  });

  const notifyUserId = author.role === 'student' ? concern.assignedToId ?? undefined : concern.studentId;
  if (notifyUserId) {
    await notifications.createNotification({
      userId: notifyUserId,
      title: 'New Comment',
      message: `${author.name} commented on "${concern.title}".`,
      type: 'comment',
      concernId: concern.id
    });
  }

  return { comment } as const;
}

export async function forwardConcern(id: string, department: string) {
  const c = await concerns.updateConcernById(id, {
    department: department.trim(),
    assignedToId: null
  } as any);

  await notifications.createNotification({
    userId: c.studentId,
    title: 'Concern Forwarded',
    message: `Your concern has been forwarded to ${c.department}.`,
    type: 'system',
    concernId: c.id
  });

  return c;
}

