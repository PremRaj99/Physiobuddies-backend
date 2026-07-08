import { redisClient } from '@/shared/redis';
import { getSlotHoldKey, HOLD_DURATION_MINUTES, ALL_SLOTS } from '@/core/constants/slots';
import prisma from '@/config/prisma';
import { ValidationError } from '@/core/errors/ApiError';
import { addDays, addMinutes } from 'date-fns';
import { randomBytes } from 'crypto';

export interface HoldMetadata {
  therapistId: string;
  patientId: string;
  date: string; // ISO string
  startHour: number;
  expiresAt: string; // ISO string
}

export class SlotManager {
  static async holdSlot(
    therapistId: string,
    patientId: string,
    dateOnly: Date,
    startHour: number,
  ): Promise<{ reservationId: string; expiresAt: Date }> {
    const holdKey = getSlotHoldKey(
      therapistId,
      dateOnly.toISOString().split('T')[0] as string,
      startHour,
    );

    // 1. Check Redis for existing hold
    const existingHoldId = await redisClient.get(holdKey);
    if (existingHoldId) {
      const holdDataStr = await redisClient.get(`reservation:hold:${existingHoldId}`);
      if (holdDataStr) {
        const holdData = JSON.parse(holdDataStr) as HoldMetadata;
        if (holdData.patientId !== patientId) {
          throw new ValidationError('This slot is currently being held by someone else.');
        }
        // Clean up previous hold metadata key if overwriting/refreshing
        await redisClient.del(`reservation:hold:${existingHoldId}`);
      }
    }

    // 2. Check DB for existing reservation (booked or blocked)
    const existingReservation = await prisma.slotReservation.findFirst({
      where: {
        therapistId,
        date: dateOnly,
        startHour,
        deletedAt: { isSet: false },
      },
    });

    if (existingReservation) {
      if (existingReservation.status === 'booked' || existingReservation.status === 'blocked') {
        throw new ValidationError('This slot is not available.');
      }
    }

    // 3. Create Hold in Redis
    const now = new Date();
    const expiresAt = addMinutes(now, HOLD_DURATION_MINUTES);
    const reservationId = randomBytes(12).toString('hex');

    const holdData: HoldMetadata = {
      therapistId,
      patientId,
      date: dateOnly.toISOString(),
      startHour,
      expiresAt: expiresAt.toISOString(),
    };

    await Promise.all([
      redisClient.set(holdKey, reservationId, { EX: HOLD_DURATION_MINUTES * 60 }),
      redisClient.set(`reservation:hold:${reservationId}`, JSON.stringify(holdData), {
        EX: HOLD_DURATION_MINUTES * 60,
      }),
    ]);

    return { reservationId, expiresAt };
  }

  static async getAndRemoveHold(
    reservationId: string,
    patientId: string,
  ): Promise<HoldMetadata | null> {
    const holdDataStr = await redisClient.get(`reservation:hold:${reservationId}`);
    if (!holdDataStr) return null;

    const holdData = JSON.parse(holdDataStr) as HoldMetadata;
    if (holdData.patientId !== patientId) {
      throw new ValidationError('You can only access your own reservations.');
    }

    const now = new Date();
    const expiresAt = new Date(holdData.expiresAt);
    if (expiresAt < now) {
      throw new ValidationError('This hold has expired.');
    }

    const dateOnly = new Date(holdData.date);
    const holdKey = getSlotHoldKey(
      holdData.therapistId,
      dateOnly.toISOString().split('T')[0] as string,
      holdData.startHour,
    );

    // Cleanup Redis keys
    await Promise.all([
      redisClient.del(holdKey),
      redisClient.del(`reservation:hold:${reservationId}`),
    ]);

    return holdData;
  }

  static async removeHoldOnly(
    reservationId: string,
    patientId: string,
  ): Promise<HoldMetadata | null> {
    const holdDataStr = await redisClient.get(`reservation:hold:${reservationId}`);
    if (!holdDataStr) return null;

    const holdData = JSON.parse(holdDataStr) as HoldMetadata;
    if (holdData.patientId !== patientId) {
      throw new ValidationError('You can only cancel your own reservations.');
    }

    const dateOnly = new Date(holdData.date);
    const holdKey = getSlotHoldKey(
      holdData.therapistId,
      dateOnly.toISOString().split('T')[0] as string,
      holdData.startHour,
    );

    await Promise.all([
      redisClient.del(holdKey),
      redisClient.del(`reservation:hold:${reservationId}`),
    ]);

    return holdData;
  }

  static getSlotHoldKeys(therapistId: string, todayStart: Date, days: number) {
    const slotKeys: string[] = [];
    const keyToSlotMap = new Map<string, { dateKey: string; startHour: number }>();

    for (let i = 0; i < days; i++) {
      const currentDay = addDays(todayStart, i);
      const dateKey = currentDay.toISOString().split('T')[0];
      if (!dateKey) continue;
      for (const slotDef of ALL_SLOTS) {
        const holdKey = getSlotHoldKey(therapistId, dateKey, slotDef.startHour);
        slotKeys.push(holdKey);
        keyToSlotMap.set(holdKey, { dateKey, startHour: slotDef.startHour });
      }
    }
    return { slotKeys, keyToSlotMap };
  }
}
