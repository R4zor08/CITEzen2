import { z } from 'zod';

export const updateUserRequestSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  department: z.string().optional(),
  course: z.string().optional(),
  profilePicture: z.string().optional(),
  role: z.string().optional(),
  studentId: z.union([z.string(), z.null()]).optional(),
  password: z.string().optional()
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

