import { z } from 'zod';

export const codeRegex = /^[A-Z0-9]+$/; // Only uppercase letters and numbers

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .toUpperCase()
    .trim()
    .regex(codeRegex, 'Code must contain only uppercase letters and numbers'),
  minPrice: z.number().positive('Minimum price must be positive'),
  discount: z.number().positive('Discount must be positive'),
  expiresOn: z.string().refine((dateStr) => !isNaN(Date.parse(dateStr)), 'Invalid date format'),
  status: z.enum(['active', 'inactive'], 'Status must be either active or inactive').optional(),
  isGlobal: z.boolean().optional(),
  therapistIds: z.array(z.string()).optional(),
  patientIds: z.array(z.string()).optional(),
});
export type CreateCouponDTO = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.partial();

export type UpdateCouponDTO = z.infer<typeof updateCouponSchema>;
