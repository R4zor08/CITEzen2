import { z } from 'zod';
import type { Role } from '../types.js';

const roleSchema = z.enum(['student', 'staff', 'admin']) satisfies z.ZodType<Role>;

export const userIdParamSchema = z.object({
  id: z.string().min(1)
});

export const updateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  course: z.string().optional(),
  profilePicture: z.string().optional(),
  role: roleSchema.optional(),
  studentId: z.union([z.string(), z.null()]).optional(),
  password: z.string().min(6).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update user'
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

