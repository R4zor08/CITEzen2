import { z } from 'zod';
import type { Role } from '../types.js';

const roleSchema = z.enum(['student', 'staff', 'admin']) satisfies z.ZodType<Role>;

export const loginRequestSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  role: roleSchema
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: roleSchema,
  studentId: z.string().min(1).optional(),
  course: z.string().min(1).optional(),
  department: z.string().min(1).optional()
}).superRefine((data, ctx) => {
  if (data.role === 'student' && !data.studentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['studentId'],
      message: 'studentId is required for student accounts'
    });
  }
  if (data.role === 'student') {
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'NEMSU email is required for student accounts'
      });
    } else if (!/^[^\s@]+@nemsu\.edu\.ph$/i.test(data.email.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Use your official NEMSU email (e.g. name@nemsu.edu.ph)'
      });
    }
  }
  if ((data.role === 'staff' || data.role === 'admin') && !data.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'email is required for staff/admin accounts'
    });
  }
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

