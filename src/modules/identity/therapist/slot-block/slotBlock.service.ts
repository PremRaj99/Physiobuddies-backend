import prisma from '@/config/prisma';
import { ValidationError } from '@/core/errors/ApiError';
import { ALL_SLOTS, isValidSlotHour, SLOT_DURATION, getSlotHoldKey } from '@/core/constants/slots';
import { therapistService } from '../therapist.service';
import { BlockSlotsDTO, UpdateWeeklyScheduleDTO } from './slotBlock.type';
import { redisClient } from '@/shared/redis';

class SlotBlockService {
  async blockSlots(data: BlockSlotsDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const { date, startHours } = data;

    // Validate all hours
    for (const hour of startHours) {
      if (!isValidSlotHour(hour)) {
        throw new ValidationError(`Invalid slot hour: ${hour}. Must be between 6 and 21.`);
      }
    }

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // Check Redis for existing holds
    const dateStr = dateOnly.toISOString().split('T')[0] as string;
    const holdKeys = startHours.map((hour) => getSlotHoldKey(therapist.id, dateStr, hour));
    const redisHolds = await redisClient.mGet(holdKeys);

    const heldHoursInRedis: number[] = [];
    startHours.forEach((hour, idx) => {
      if (redisHolds[idx]) {
        heldHoursInRedis.push(hour);
      }
    });

    // Check for existing non-deleted reservations at these hours in DB
    const existing = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        date: dateOnly,
        startHour: { in: startHours },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    const existingHours = new Set(existing.map((r) => r.startHour));
    const dbBookedHours = existing.filter((r) => r.status === 'booked').map((r) => r.startHour);

    const unavailableHours = Array.from(new Set([...dbBookedHours, ...heldHoursInRedis]));

    if (unavailableHours.length > 0) {
      throw new ValidationError(
        `Cannot block hours [${unavailableHours.join(', ')}] — they are already booked or held.`,
      );
    }

    // Create blocked reservations for hours that don't already have a 'blocked' reservation
    const toBlock = startHours.filter((h) => !existingHours.has(h));

    if (toBlock.length === 0) {
      return { message: 'All requested slots are already blocked.' };
    }

    const slotDefs = ALL_SLOTS.filter((s) => toBlock.includes(s.startHour));

    await prisma.slotReservation.createMany({
      data: slotDefs.map((slot) => ({
        therapistId: therapist.id,
        startHour: slot.startHour,
        startTime: new Date(dateOnly.getTime() + slot.startHour * 60 * 60 * 1000),
        endTime: new Date(dateOnly.getTime() + (slot.startHour * 60 + SLOT_DURATION) * 60 * 1000),
        date: dateOnly,
        status: 'blocked' as const,
      })),
    });

    return { message: `Blocked ${toBlock.length} slot(s).`, blockedHours: toBlock };
  }

  async unblockSlots(data: BlockSlotsDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const { date, startHours } = data;

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const result = await prisma.slotReservation.updateMany({
      where: {
        therapistId: therapist.id,
        date: dateOnly,
        startHour: { in: startHours },
        status: 'blocked',
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      data: { deletedAt: new Date() },
    });

    return { message: `Unblocked ${result.count} slot(s).` };
  }

  async getWeeklySchedule(userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const therapistSlot = await prisma.therapistSlot.findUnique({
      where: { therapistId: therapist.id },
    });
    return {
      schedule: therapistSlot ? (therapistSlot.schedule as Record<string, string[]>) : {},
    };
  }

  async updateWeeklySchedule(userId: string, data: UpdateWeeklyScheduleDTO) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const therapistSlot = await prisma.therapistSlot.upsert({
      where: { therapistId: therapist.id },
      update: { schedule: data.schedule },
      create: {
        therapistId: therapist.id,
        schedule: data.schedule,
      },
    });
    return {
      message: 'Weekly defaults updated successfully.',
      schedule: therapistSlot.schedule,
    };
  }

  async getBlocksAndLeaves(userId: string, dateStr: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const dateOnly = new Date(dateStr);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // 1. Check if on leave
    const leaves = await prisma.therapistLeave.findFirst({
      where: {
        therapistId: therapist.id,
        startDate: { lte: dateOnly },
        endDate: { gte: dateOnly },
      },
    });

    // 2. Check blocked slot reservations
    const blockedReservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        date: dateOnly,
        status: 'blocked',
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    const blockedHours = blockedReservations.map((r) => r.startHour);

    return {
      isOff: !!leaves,
      blockedHours,
    };
  }

  async getOverrides(userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const blockedReservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        status: 'blocked',
        date: { gte: today },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      orderBy: { date: 'asc' },
    });

    const grouped: Record<string, number[]> = {};
    blockedReservations.forEach((r) => {
      const dateStr = r.date.toISOString().split('T')[0];
      if (dateStr) {
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(r.startHour);
      }
    });

    const list = Object.entries(grouped).map(([date, hours]) => {
      hours.sort((a, b) => a - b);
      return {
        date,
        blockedHours: hours,
        isOff: hours.length === 16,
      };
    });

    return list;
  }
}

export default new SlotBlockService();
