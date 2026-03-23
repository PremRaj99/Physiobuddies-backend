import { codeRegex } from '@/modules/admin/coupon/adminCoupon.types';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { z } from 'zod';

export const ApplyCouponRequestSchema = z.object({
  treatmentSessionId: ObjectIdSchema,
  couponCode: z
    .string()
    .min(1, 'Coupon Code is required')
    .max(50, 'Coupon Code must be at most 50 characters')
    .toUpperCase()
    .trim()
    .regex(codeRegex, 'Coupon Code must contain only uppercase letters and numbers'),
});

export type ApplyCouponRequestDTO = z.infer<typeof ApplyCouponRequestSchema>;
