import { z } from 'zod';
import type { Priority, Role } from '../types.js';

const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']) satisfies z.ZodType<Priority>;
const roleSchema = z.enum(['student', 'staff', 'admin']) satisfies z.ZodType<Role>;

export const createConcernRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  priority: prioritySchema.optional(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  department: z.string().optional(),
  formData: z.record(z.unknown()).optional(),
  attachments: z.array(z.string()).optional()
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
  content: z.string().optional(),
  authorId: z.string().optional(),
  visibleTo: z.array(roleSchema).optional()
});
export type AddCommentRequest = z.infer<typeof addCommentRequestSchema>;

export const forwardConcernRequestSchema = z.object({
  department: z.string().optional()
});
export type ForwardConcernRequest = z.infer<typeof forwardConcernRequestSchema>;

