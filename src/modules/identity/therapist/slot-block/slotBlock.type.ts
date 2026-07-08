import { z } from 'zod';

export const BlockSlotsSchema = z.object({
  date: z.string().datetime(), // ISO datetime string
  startHours: z.array(z.number().int().min(6).max(21)).min(1),
});

export type BlockSlotsDTO = z.infer<typeof BlockSlotsSchema>;

const WeeklyDayScheduleSchema = z.union([
  z.array(z.enum(['morning', 'evening', 'night'])),
  z.object({
    shifts: z.array(z.enum(['morning', 'evening', 'night'])).default([]),
    disabledHours: z.array(z.number().int().min(6).max(21)).default([]),
  }),
]);

export const UpdateWeeklyScheduleSchema = z.object({
  schedule: z.object({
    sunday: WeeklyDayScheduleSchema.optional(),
    monday: WeeklyDayScheduleSchema.optional(),
    tuesday: WeeklyDayScheduleSchema.optional(),
    wednesday: WeeklyDayScheduleSchema.optional(),
    thursday: WeeklyDayScheduleSchema.optional(),
    friday: WeeklyDayScheduleSchema.optional(),
    saturday: WeeklyDayScheduleSchema.optional(),
  }),
});

export type UpdateWeeklyScheduleDTO = z.infer<typeof UpdateWeeklyScheduleSchema>;
