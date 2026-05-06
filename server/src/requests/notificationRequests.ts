import { z } from 'zod';

export const markAllReadRequestSchema = z.object({
  userId: z.string().optional()
});
export type MarkAllReadRequest = z.infer<typeof markAllReadRequestSchema>;

