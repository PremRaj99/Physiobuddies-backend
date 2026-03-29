import { z } from 'zod';

export const TherapistQuerySchema = z.object({
  lng: z.number().optional(),
  lat: z.number().optional(),
  radius: z.number().optional(),
  mode: z.enum(['home_visit', 'online', 'clinic']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  specialization: z.array(z.string()).optional(),
  price: z.array(z.number().nonnegative()).length(2).optional(),
  experience: z.array(z.number().nonnegative()).length(2).optional(),
  sort: z.enum(['rating', 'experience', 'price', 'distance']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type TherapistQueryDTO = z.infer<typeof TherapistQuerySchema>;

export const TherapistLocationQuerySchema = z.object({
  lng: z.number().optional(),
  lat: z.number().optional(),
});

export type TherapistLocationQueryDTO = z.infer<typeof TherapistLocationQuerySchema>;
