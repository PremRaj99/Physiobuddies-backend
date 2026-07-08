import z from 'zod';

export const SubmitOnboardingSchema = z.object({
  dob: z.string().min(1, 'Date of birth is required'),
  displayAddress: z.string().min(1, 'Display address is required'),
  about: z.string().min(1, 'About details are required'),
  experience: z.number().min(0, 'Experience must be a positive number'),
  iapId: z.string().optional().nullable(),
  affiliation: z.string().optional().nullable(),
  specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
  education: z.array(z.string()).min(1, 'At least one education qualification is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  resume: z.string().min(1, 'Resume is required'),
  certificates: z.array(z.string()).min(1, 'At least one certificate is required'),
});

export type SubmitOnboardingDTO = z.infer<typeof SubmitOnboardingSchema>;

export const SubmitFinalOnboardingSchema = z.object({
  about: z.string(),
  address: z.string(),
  lat: z.string().or(z.number()),
  lng: z.string().or(z.number()),
  accountName: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  branchName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifsc: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
  planId: z.enum(['3m', '6m', '12m']),
  slots: z.object({
    sunday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
    monday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
    tuesday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
    wednesday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
    thursday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
    friday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
    saturday: z.array(z.enum(['morning', 'evening', 'night'])).optional(),
  }),
});

export type SubmitFinalOnboardingDTO = z.infer<typeof SubmitFinalOnboardingSchema>;
