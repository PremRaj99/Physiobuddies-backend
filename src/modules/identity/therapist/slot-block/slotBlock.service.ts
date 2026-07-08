import prisma from '@/config/prisma';
import { ValidationError } from '@/core/errors/ApiError';
import { ALL_SLOTS, isValidSlotHour, SLOT_DURATION, getSlotHoldKey } from '@/core/constants/slots';
import { therapistService } from '../therapist.service';
import { BlockSlotsDTO } from './slotBlock.type';
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
    dateOnly.setHours(0, 0, 0, 0);

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
        deletedAt: { isSet: false },
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
    dateOnly.setHours(0, 0, 0, 0);

    const result = await prisma.slotReservation.updateMany({
      where: {
        therapistId: therapist.id,
        date: dateOnly,
        startHour: { in: startHours },
        status: 'blocked',
        deletedAt: { isSet: false },
      },
      data: { deletedAt: new Date() },
    });

    return { message: `Unblocked ${result.count} slot(s).` };
  }
}

export default new SlotBlockService();
