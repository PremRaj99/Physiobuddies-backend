import { z } from 'zod';

export const BlockSlotsSchema = z.object({
  date: z.string().datetime(), // ISO datetime string
  startHours: z.array(z.number().int().min(6).max(21)).min(1),
});

export type BlockSlotsDTO = z.infer<typeof BlockSlotsSchema>;
