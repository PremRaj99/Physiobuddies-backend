import z from 'zod';

export const SubmitOnboardingSchema = z.object({
  dob: z.string(),
  displayAddress: z.string(),
  about: z.string(),
  experience: z.number(),
  iapId: z.string().optional().nullable(),
  affiliation: z.string().optional().nullable(),
  specializations: z.array(z.string()),
  education: z.array(z.string()),
  languages: z.array(z.string()),
  resume: z.string().optional().nullable(),
  certificates: z.array(z.string()).optional().nullable(),
});

export type SubmitOnboardingDTO = z.infer<typeof SubmitOnboardingSchema>;

export const SubmitFinalOnboardingSchema = z.object({
  about: z.string(),
  address: z.string(),
  lat: z.string().or(z.number()),
  lng: z.string().or(z.number()),
  accountName: z.string(),
  bankName: z.string(),
  branchName: z.string(),
  accountNumber: z.string(),
  ifsc: z.string(),
  upiId: z.string().optional().nullable(),
  planId: z.enum(['3m', '6m', '12m']),
  slots: z.record(z.string(), z.array(z.string())),
});

export type SubmitFinalOnboardingDTO = z.infer<typeof SubmitFinalOnboardingSchema>;
