import { z } from 'zod';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

export const CreateBookingSessionSchema = z.object({
  therapistId: ObjectIdSchema,
  date: z.string().datetime(), // ISO datetime
  startHour: z.number().int().min(6).max(21),
});

export const UpdateBookingFormSchema = z.object({
  step: z.number().int().min(1).max(4).optional(),
  patientDetailId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  conditionId: z.string().optional().nullable(),
  problemDesc: z.string().optional(),
});

export const ApplyCouponSchema = z.object({
  couponCode: z.string().min(1, 'Coupon code is required').trim(),
});

export type CreateBookingSessionDTO = z.infer<typeof CreateBookingSessionSchema>;
export type UpdateBookingFormDTO = z.infer<typeof UpdateBookingFormSchema>;
export type ApplyCouponDTO = z.infer<typeof ApplyCouponSchema>;

export interface BookingSessionData {
  sessionId: string;
  reservationId: string;
  therapistId: string;
  patientId: string;
  date: string; // ISO date string
  startHour: number;
  createdAt: string; // ISO datetime
  expiresAt: string; // ISO datetime
  step: number;
  formData: {
    patientDetailId: string | null;
    locationId: string | null;
    conditionId: string | null;
    problemDesc: string;
    couponCode: string | null;
    couponDiscount: number;
  };
  paymentPhase: boolean;
  paymentId: string | null;
}
