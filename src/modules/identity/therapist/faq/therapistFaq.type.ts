import { z } from 'zod';

export const TherapistFaqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const UpdateTherapistFaqSchema = z.object({
  question: z.string().min(1, 'Question is required').optional(),
  answer: z.string().min(1, 'Answer is required').optional(),
});

export type TherapistFaqDTO = z.infer<typeof TherapistFaqSchema>;
export type UpdateTherapistFaqDTO = z.infer<typeof UpdateTherapistFaqSchema>;
