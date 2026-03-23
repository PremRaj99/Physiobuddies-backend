import { z } from 'zod';

export const UpdateCommissionRateSchema = z.object({
  commissionRate: z.number().min(0).max(100),
});

export type UpdateCommissionRateDTO = z.infer<typeof UpdateCommissionRateSchema>;
