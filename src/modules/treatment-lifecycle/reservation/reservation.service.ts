import prisma from '@/config/prisma';
import { ValidationError, NotFoundError } from '@/core/errors/ApiError';
import { redisClient } from '@/shared/redis';
import {
  ALL_SLOTS,
  getSlotHoldKey,
  isValidSlotHour,
  MIN_BOOKING_LEAD_MINUTES,
  SLOT_DURATION,
  WeekdayScheduleType,
} from '@/core/constants/slots';
import { SlotManager } from './slotManagement';

class ReservationService {
  holdReservation = async (data: {
    patientId: string;
    therapistId: string;
    date: Date;
    startHour: number;
  }) => {
    const { patientId, therapistId, date, startHour } = data;

    if (!isValidSlotHour(startHour)) {
      throw new ValidationError('Invalid slot start hour.');
    }

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const slotStart = new Date(dateOnly);
    slotStart.setUTCHours(startHour, 0, 0, 0);
    const now = new Date();

    // 1. Check 1-hour lead time
    const leadTimeMs = slotStart.getTime() - now.getTime();
    if (leadTimeMs < MIN_BOOKING_LEAD_MINUTES * 60 * 1000) {
      throw new ValidationError(
        `Must book at least ${MIN_BOOKING_LEAD_MINUTES} minutes in advance.`,
      );
    }

    // 2. Check Therapist Schedule & Leave
    const [therapistSlot, leaves] = await Promise.all([
      prisma.therapistSlot.findUnique({ where: { therapistId } }),
      prisma.therapistLeave.findMany({
        where: {
          therapistId,
          startDate: { lte: dateOnly },
          endDate: { gte: dateOnly },
        },
      }),
    ]);

    if (!therapistSlot) {
      throw new ValidationError('Therapist schedule not configured.');
    }
    if (leaves.length > 0) {
      throw new ValidationError('Therapist is on leave for this date.');
    }

    const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekday = WEEKDAYS[dateOnly.getUTCDay()] as string;
    const schedule = therapistSlot.schedule as Record<string, WeekdayScheduleType>;
    const daySchedule = schedule[weekday];
    let shifts: string[] = [];
    let disabledHours: number[] = [];

    if (Array.isArray(daySchedule)) {
      shifts = daySchedule;
    } else if (daySchedule && typeof daySchedule === 'object') {
      shifts = daySchedule.shifts || [];
      disabledHours = daySchedule.disabledHours || [];
    }

    const slotDef = ALL_SLOTS.find((s) => s.startHour === startHour);

    if (!slotDef || !shifts.includes(slotDef.category) || disabledHours.includes(startHour)) {
      throw new ValidationError('Therapist does not work during this slot on this day.');
    }

    // 3. Delegate hold logic to SlotManager
    const holdResult = await SlotManager.holdSlot(therapistId, patientId, dateOnly, startHour);

    return {
      reservationId: holdResult.reservationId,
      message: 'Slot held successfully',
      expiresAt: holdResult.expiresAt,
    };
  };

  confirmReservation = async (reservationId: string, patientId: string) => {
    // 1. Check if there's a hold in Redis
    const holdData = await SlotManager.getAndRemoveHold(reservationId, patientId);

    if (holdData) {
      const dateOnly = new Date(holdData.date);
      const slotStart = new Date(dateOnly);
      slotStart.setHours(holdData.startHour, 0, 0, 0);

      // Confirm it by creating the booked reservation in the DB
      const reservation = await prisma.slotReservation.create({
        data: {
          id: reservationId,
          therapistId: holdData.therapistId,
          patientId: holdData.patientId,
          date: dateOnly,
          startHour: holdData.startHour,
          startTime: slotStart,
          endTime: new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000),
          status: 'booked',
        },
      });

      return { reservationId: reservation.id, message: 'Reservation confirmed successfully' };
    }

    // 2. If not found in Redis, check if it's already booked/blocked in DB
    const reservation = await prisma.slotReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.deletedAt) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.patientId !== patientId) {
      throw new ValidationError('You can only confirm your own reservations.');
    }

    if (reservation.status === 'booked') {
      return { reservationId, message: 'Reservation is already confirmed' };
    }

    throw new ValidationError(`Cannot confirm reservation with status ${reservation.status}`);
  };

  cancelReservation = async (reservationId: string, patientId: string) => {
    // 1. Try to remove hold from Redis
    const holdData = await SlotManager.removeHoldOnly(reservationId, patientId);

    if (holdData) {
      return { reservationId, message: 'Reservation cancelled successfully' };
    }

    // 2. Otherwise, check the DB
    const reservation = await prisma.slotReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.deletedAt) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.patientId !== patientId) {
      throw new ValidationError('You can only cancel your own reservations.');
    }

    await prisma.slotReservation.update({
      where: { id: reservationId },
      data: { deletedAt: new Date() },
    });

    // Just in case there was any leftover hold key in Redis
    const holdKey = getSlotHoldKey(
      reservation.therapistId,
      reservation.date.toISOString().split('T')[0] as string,
      reservation.startHour,
    );
    await redisClient.del(holdKey);

    return { reservationId, message: 'Reservation cancelled successfully' };
  };
}

export const reservationService = new ReservationService();
