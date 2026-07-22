import { z } from 'zod';

export const CreateComplaintSchema = z.object({
  type: z.string().min(1, 'Issue category is required'),
  description: z.string().min(1, 'Description is required'),
});

export const CreateReplySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export type CreateComplaintDTO = z.infer<typeof CreateComplaintSchema>;
export type CreateReplyDTO = z.infer<typeof CreateReplySchema>;
