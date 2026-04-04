import { z } from 'zod';

export const priceSchema = z.number('price is required').gt(0, 'price should be greater then 0');

export const UpdateCommissionRateSchema = z.object({
  commissionRate: z.number().min(0).max(100),
});

export const UpdateAdminTherapistSchema = z
  .object({
    location: z
      .object({
        lng: z.number(),
        lat: z.number(),
      })
      .optional(),
    displayAddress: z.string().optional(),
    price: priceSchema.optional(),
    priceAlt: priceSchema.optional(),
    rating: z.number().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    mode: z.enum(['home_visit', 'online', 'clinic']).optional(),
    clinic: z.string().optional(),
    about: z.string().optional(),
    dob: z.date().optional(),
    experience: z.number().gte(0).optional(),
    specialization: z.array(z.string()).optional(),
    languagesSpoken: z.array(z.string()).optional(),
    educationQualification: z.array(z.string()).optional(),
    currentlyAffiliation: z.string().optional(),
    IAPId: z.string().optional(),
    professionalCertificates: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.location) {
        return data.displayAddress;
      }
      return true;
    },
    {
      message: 'If change location display Address is required',
      path: ['displayAddress'],
    },
  );

export type UpdateAdminTherapistDTO = z.infer<typeof UpdateAdminTherapistSchema>;

export type UpdateCommissionRateDTO = z.infer<typeof UpdateCommissionRateSchema>;
