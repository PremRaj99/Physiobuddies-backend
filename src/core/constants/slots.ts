/**
 * Hardcoded slot definitions for the scheduling system.
 *
 * Each slot is 40 minutes of session + 20 minutes of break = 60-minute cycle.
 * Slots run from 06:00 to 21:40 (16 slots total).
 */

export const SLOT_DURATION = 40; // minutes
export const SLOT_BREAK = 20; // minutes
export const SLOT_START_HOUR = 6;
export const SLOT_END_HOUR = 21; // last slot starts at 21:00
export const TOTAL_SLOTS = SLOT_END_HOUR - SLOT_START_HOUR + 1; // 16

export const HOLD_DURATION_MINUTES = 20;
export const FORM_HOLD_MINUTES = 10;
export const PAYMENT_HOLD_MINUTES = 10;
export const MIN_BOOKING_LEAD_MINUTES = 60; // must book at least 1 hour before slot
export const BOOKING_SESSION_PREFIX = 'booking:session:';

export type SlotCategory = 'morning' | 'evening' | 'night';
export const SLOT_CATEGORIES: SlotCategory[] = ['morning', 'evening', 'night'];

export const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface SlotDefinition {
  startHour: number; // 6–21
  startMinute: number; // always 0
  endHour: number;
  endMinute: number; // always 40
  category: SlotCategory;
}

/**
 * Returns the category for a given hour.
 *  - Morning: 06:00–11:40  (hours 6–11)
 *  - Evening: 12:00–17:40  (hours 12–17)
 *  - Night:   18:00–21:40  (hours 18–21)
 */
export const getCategoryForHour = (hour: number): SlotCategory => {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'evening';
  return 'night';
};

/** All 16 slot definitions for a day */
export const ALL_SLOTS: SlotDefinition[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const hour = SLOT_START_HOUR + i;
  return {
    startHour: hour,
    startMinute: 0,
    endHour: hour,
    endMinute: SLOT_DURATION,
    category: getCategoryForHour(hour),
  };
});

/** Slots grouped by category */
export const CATEGORY_SLOTS: Record<SlotCategory, SlotDefinition[]> = {
  morning: ALL_SLOTS.filter((s) => s.category === 'morning'),
  evening: ALL_SLOTS.filter((s) => s.category === 'evening'),
  night: ALL_SLOTS.filter((s) => s.category === 'night'),
};

export type WeekdayScheduleType =
  | string[]
  | {
      shifts?: string[];
      disabledHours?: number[];
    };

export const getSlotsForSchedule = (
  schedule: Record<string, WeekdayScheduleType>,
  weekday: string,
): SlotDefinition[] => {
  const daySchedule = schedule[weekday];
  if (!daySchedule) return [];

  let shifts: string[] = [];
  let disabledHours: number[] = [];

  if (Array.isArray(daySchedule)) {
    shifts = daySchedule;
  } else if (daySchedule && typeof daySchedule === 'object') {
    shifts = daySchedule.shifts || [];
    disabledHours = daySchedule.disabledHours || [];
  }

  return ALL_SLOTS.filter(
    (slot) => shifts.includes(slot.category) && !disabledHours.includes(slot.startHour),
  );
};

/** Validate that a startHour is within the valid slot range */
export const isValidSlotHour = (hour: number): boolean => {
  return Number.isInteger(hour) && hour >= SLOT_START_HOUR && hour <= SLOT_END_HOUR;
};

/** Redis key for slot hold */
export const getSlotHoldKey = (therapistId: string, date: string, startHour: number): string => {
  return `slot:hold:${therapistId}:${date}:${startHour}`;
};
