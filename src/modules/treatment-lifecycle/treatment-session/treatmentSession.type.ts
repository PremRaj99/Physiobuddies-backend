import { z } from 'zod';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

// --- Reschedule ---
export const RescheduleSlotSchema = z.object({
  date: z.string().datetime(),
  startHour: z.number().int().min(6).max(21),
  reason: z.string().optional(),
});
export type RescheduleSlotDTO = z.infer<typeof RescheduleSlotSchema>;

// --- Cancel ---
export const CancelSessionSchema = z.object({
  reason: z.string().optional(),
});
export type CancelSessionDTO = z.infer<typeof CancelSessionSchema>;

// --- Add Documents ---
export const AddDocsSchema = z.object({
  documents: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1),
        fileType: z.string().min(1), // e.g. "pdf", "image/png"
      }),
    )
    .min(1, 'At least one document is required'),
});
export type AddDocsDTO = z.infer<typeof AddDocsSchema>;

// --- Improvement Record ---
export const ImprovementRecordSchema = z.object({
  painScoreBefore: z.number().int().min(0).max(10).optional(),
  painScoreAfter: z.number().int().min(0).max(10),
  improvementNotes: z.string().min(1),
  exercisesGiven: z.array(z.string()).optional(),
});
export type ImprovementRecordDTO = z.infer<typeof ImprovementRecordSchema>;

// --- Verify OTP ---
export const VerifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
export type VerifyOtpDTO = z.infer<typeof VerifyOtpSchema>;

// --- Book More Session (on existing treatment plan) ---
export const BookMoreSessionSchema = z.object({
  treatmentPlanId: ObjectIdSchema,
  date: z.string().datetime(),
  startHour: z.number().int().min(6).max(21),
});
export type BookMoreSessionDTO = z.infer<typeof BookMoreSessionSchema>;
