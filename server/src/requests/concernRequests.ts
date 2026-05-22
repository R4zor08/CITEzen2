import { z } from 'zod';
import type { Priority, Role } from '../types.js';

const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']) satisfies z.ZodType<Priority>;
const roleSchema = z.enum(['student', 'staff', 'admin']) satisfies z.ZodType<Role>;
const concernStatusSchema = z.enum(['pending', 'in-progress', 'resolved', 'rejected']);

export const concernAttachmentSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive().max(10 * 1024 * 1024),
  dataUrl: z.string().min(1),
  field: z.string().optional()
});

export const concernIdParamSchema = z.object({
  id: z.string().min(1)
});

export const listConcernsQuerySchema = z.object({
  studentId: z.string().optional(),
  department: z.string().optional(),
  assignedToId: z.string().optional(),
  status: concernStatusSchema.optional()
});

export const createConcernRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  priority: prioritySchema.optional(),
  // Ownership fields are bound from authenticated user server-side.
  studentId: z.string().min(1).optional(),
  studentName: z.string().min(1).optional(),
  department: z.string().optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(concernAttachmentSchema).max(15).optional()
});
export type CreateConcernRequest = z.infer<typeof createConcernRequestSchema>;

export const updateConcernRequestSchema = z.object({
  status: z.string().optional(),
  priority: prioritySchema.optional(),
  assignedTo: z.union([z.string(), z.null()]).optional(),
  department: z.string().optional()
});
export type UpdateConcernRequest = z.infer<typeof updateConcernRequestSchema>;

export const addCommentRequestSchema = z.object({
  content: z.string().min(1),
  visibleTo: z.array(roleSchema).optional()
});
export type AddCommentRequest = z.infer<typeof addCommentRequestSchema>;

export const forwardConcernRequestSchema = z.object({
  department: z.string().min(1)
});
export type ForwardConcernRequest = z.infer<typeof forwardConcernRequestSchema>;

const verifiedImageMimeSchema = z.enum(['image/png', 'image/jpeg']);

export const verifyAttachmentRequestSchema = z.object({
  dataUrl: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: verifiedImageMimeSchema
});
export type VerifyAttachmentRequest = z.infer<typeof verifyAttachmentRequestSchema>;

