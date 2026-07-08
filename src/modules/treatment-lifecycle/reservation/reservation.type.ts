import { z } from 'zod';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

export const HoldReservationSchema = z.object({
  therapistId: ObjectIdSchema,
  date: z.string().datetime(), // ISO datetime string
  startHour: z.number().int().min(6).max(21),
});

export type HoldReservationDTO = z.infer<typeof HoldReservationSchema>;
