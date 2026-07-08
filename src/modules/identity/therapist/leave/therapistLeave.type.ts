import { z } from 'zod';

export const ApplyLeaveSchema = z.object({
  startDate: z.string().datetime(), // ISO datetime string
  endDate: z.string().datetime(), // ISO datetime string
  reason: z.string().optional(),
});

export type ApplyLeaveDTO = z.infer<typeof ApplyLeaveSchema>;
