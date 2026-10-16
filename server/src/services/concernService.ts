import type { ConcernAttachment, Priority, Role } from '../types.js';
import { statusFromApi } from '../mappers.js';
import { validateAttachmentsForCreate } from './concernAttachmentService.js';
import { classifyConcernWithGemini } from './geminiConcernService.js';
import * as concerns from '../repositories/concernRepository.js';
import * as users from '../repositories/userRepository.js';
import * as comments from '../repositories/commentRepository.js';
import * as notifications from '../repositories/notificationRepository.js';

export async function listConcerns(filters: {
  studentId?: string;
  department?: string;
  assignedToId?: string;
  status?: string;
  adminReviewStatus?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.studentId) where.studentId = filters.studentId;

  // Staff queries (filtered by department or assignedToId) should only see confirmed concerns
  if (filters.department && filters.assignedToId) {
    where.$or = [
      { department: filters.department },
      { assignedToId: filters.assignedToId }
    ];
    where.adminReviewStatus = { $ne: 'pending' };
  } else if (filters.department) {
    where.department = filters.department;
    where.adminReviewStatus = { $ne: 'pending' };
  } else if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
    where.adminReviewStatus = { $ne: 'pending' };
  }
  if (filters.status) where.status = statusFromApi(filters.status);
  if (filters.adminReviewStatus) where.adminReviewStatus = filters.adminReviewStatus;

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

  // Fetch all staff users for AI recommendation
  const rawStaff = await users.findUsersByRole('staff');
  const staffCandidates = rawStaff.map((u: any) => ({
    id: String(u.id ?? u._id),
    name: u.name,
    department: u.department,
    email: u.email
  }));

  const allDepts = Array.from(
    new Set([
      'Academic Affairs',
      'Registrar',
      'Maintenance',
      'Student Affairs',
      'Administration',
      'IT Support',
      'Finance',
      ...staffCandidates
        .map((s) => s.department)
        .filter((d): d is string => Boolean(d) && d !== 'CITE')
    ])
  ) as string[];

  // Run Gemini AI Classification & Staff Recommendation
  const aiResult = await classifyConcernWithGemini({
    title: args.title ?? 'Untitled Concern',
    description: args.description ?? '',
    departments: allDepts,
    staffCandidates
  });

  const category = aiResult.concernCategory || aiResult.category || 'Academic';
  const subcategory = aiResult.subcategory || aiResult.concernSummary || 'General Inquiry';
  const department = aiResult.department;
  const priority = args.priority ?? aiResult.priority ?? 'medium';
  const suggestedStaffId = aiResult.suggestedStaffId;
  const suggestedStaffName = aiResult.suggestedStaffName;

  const c = await concerns.createConcern({
    title: args.title ?? 'Untitled Concern',
    description: args.description ?? '',
    category,
    subcategory,
    priority,
    studentId: args.studentId,
    studentName: args.studentName,
    department,
    formData: args.formData !== undefined ? JSON.stringify(args.formData) : null,
    attachments: args.attachments !== undefined ? JSON.stringify(args.attachments) : null,
    aiClassification: JSON.stringify(aiResult),
    suggestedStaffId,
    suggestedStaffName,
    adminReviewStatus: 'pending',
    isConfirmed: false,
    assignedToId: null // Admin has not confirmed yet
  });

  // Notify student
  await notifications.createNotification({
    userId: args.studentId,
    title: 'Concern Submitted & AI Analyzed',
    message: `Your concern "${c.title}" was analyzed by AI (${category} • ${department}) and is queued for Admin review.`,
    type: 'system',
    concernId: c.id
  });

  const attachmentCount = args.attachments?.length ?? 0;
  const attachmentNote =
    attachmentCount > 0
      ? ` (${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''})`
      : '';

  // Only notify admins for review & confirmation (Staff will receive the concern once confirmed)
  const admins = await users.findUsersByRole('admin');
  for (const u of admins) {
    const anyU = u as { id?: string; _id?: { toString(): string } };
    const adminId = anyU.id ?? anyU._id?.toString();
    if (!adminId) continue;
    await notifications.createNotification({
      userId: adminId,
      title: 'New Concern Awaiting Confirmation',
      message: `${args.studentName} submitted "${c.title}". AI recommends ${category} → ${department}${
        suggestedStaffName ? ` (${suggestedStaffName})` : ''
      }${attachmentNote}.`,
      type: 'system',
      concernId: c.id
    });
  }

  return { concern: c } as const;
}

export async function confirmConcern(args: {
  id: string;
  adminId: string;
  assignedToId: string;
  department?: string;
  category?: string;
  subcategory?: string;
}) {
  const prev = await concerns.getConcernById(args.id);
  if (!prev) return { notFound: true as const };

  const staffUser = await users.findUserById(args.assignedToId);
  if (!staffUser) {
    return { error: 'Assigned staff member not found' as const };
  }

  const updateData: Record<string, unknown> = {
    assignedToId: args.assignedToId,
    adminReviewStatus: 'confirmed',
    isConfirmed: true,
    status: prev.status === 'pending' ? 'pending' : prev.status
  };

  if (args.department) updateData.department = args.department.trim();
  if (args.category) updateData.category = args.category.trim();
  if (args.subcategory) updateData.subcategory = args.subcategory.trim();

  const c = await concerns.updateConcernById(args.id, updateData as any);

  // Notify assigned staff
  await notifications.createNotification({
    userId: args.assignedToId,
    title: 'New Concern Assigned',
    message: `Admin confirmed and forwarded "${c.title}" to you for processing.`,
    type: 'assignment',
    concernId: c.id
  });

  // Notify student
  await notifications.createNotification({
    userId: c.studentId,
    title: 'Concern Confirmed & Forwarded',
    message: `Your concern "${c.title}" has been reviewed by Admin and forwarded to ${staffUser.name} (${c.department}) for processing.`,
    type: 'status_change',
    concernId: c.id
  });

  return { concern: c } as const;
}

export async function updateConcern(
  id: string,
  b: Partial<{
    status: string;
    priority: Priority;
    assignedTo: string | null;
    department: string;
    category: string;
    subcategory: string;
    adminReviewStatus: string;
    isConfirmed: boolean;
  }>
) {
  const prev = await concerns.getConcernLiteById(id);
  if (!prev) return { notFound: true as const };

  const data: Record<string, unknown> = {};
  if (b.status !== undefined) data.status = statusFromApi(b.status);
  if (b.priority !== undefined) data.priority = b.priority;
  if (b.department !== undefined) data.department = b.department;
  if (b.category !== undefined) data.category = b.category;
  if (b.subcategory !== undefined) data.subcategory = b.subcategory;
  if (b.adminReviewStatus !== undefined) data.adminReviewStatus = b.adminReviewStatus;
  if (b.isConfirmed !== undefined) data.isConfirmed = b.isConfirmed;

  if (b.assignedTo !== undefined) {
    data.assignedToId = b.assignedTo;
    if (b.assignedTo) {
      data.isConfirmed = true;
      data.adminReviewStatus = 'confirmed';
    }
  }

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

