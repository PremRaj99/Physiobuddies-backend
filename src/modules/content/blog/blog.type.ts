import { z } from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().min(1, 'Summary is required'),
  tags: z.string().min(1, 'Tags are required'),
  thumbnail: z.string().min(1, 'Thumbnail is required'),
  slug: z.string().min(1, 'Slug is required'),
  readTime: z.string().optional(),
});

export const UpdateBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  summary: z.string().min(1, 'Summary is required').optional(),
  tags: z.string().min(1, 'Tags are required').optional(),
  thumbnail: z.string().min(1, 'Thumbnail is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  readTime: z.string().optional(),
});

export const CreateReviewSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
});

export const ListBlogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});

export type CreateBlogDTO = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDTO = z.infer<typeof UpdateBlogSchema>;
export type CreateReviewDTO = z.infer<typeof CreateReviewSchema>;
export type ListBlogQueryDTO = z.infer<typeof ListBlogQuerySchema>;
