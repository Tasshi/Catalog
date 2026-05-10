import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  userId: z.number().int().positive(),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
