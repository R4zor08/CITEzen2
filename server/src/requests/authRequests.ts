import { z } from 'zod';
import type { Role } from '../types.js';

const roleSchema = z.enum(['student', 'staff', 'admin']) satisfies z.ZodType<Role>;

export const loginRequestSchema = z.object({
  identifier: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  role: roleSchema.optional()
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  role: roleSchema.optional(),
  studentId: z.string().min(1).optional(),
  course: z.string().min(1).optional(),
  department: z.string().min(1).optional()
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

