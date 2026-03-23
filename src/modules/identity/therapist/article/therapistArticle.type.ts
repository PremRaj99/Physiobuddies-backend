import { z } from 'zod';

export const TherapistArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export const UpdateTherapistArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
});

export type TherapistArticleDTO = z.infer<typeof TherapistArticleSchema>;
export type UpdateTherapistArticleDTO = z.infer<typeof UpdateTherapistArticleSchema>;
