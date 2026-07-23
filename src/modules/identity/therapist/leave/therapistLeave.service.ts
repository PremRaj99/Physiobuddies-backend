import prisma from '@/config/prisma';
import { ValidationError } from '@/core/errors/ApiError';
import { therapistService } from '../therapist.service';
import { ApplyLeaveDTO } from './therapistLeave.type';

class TherapistLeaveService {
  async applyLeave(data: ApplyLeaveDTO, userId: string) {
    const therapist = await therapistService.getTherapistByUserId(userId);
    const { startDate, endDate, reason } = data;

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    if (start > end) {
      throw new ValidationError('Start date must be before or equal to end date.');
    }

    const now = new Date();
    if (end < now) {
      throw new ValidationError('Leave period cannot be in the past.');
    }

    // Check if therapist has booked sessions during the leave period
    const bookedSessions = await prisma.slotReservation.findFirst({
      where: {
        therapistId: therapist.id,
        status: 'booked',
        date: {
          gte: start,
          lte: end,
        },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    if (bookedSessions) {
      throw new ValidationError(
        'Cannot apply for leave. You have active bookings during this period.',
      );
    }

    // Create the leave record
    const leave = await prisma.therapistLeave.create({
      data: {
        therapistId: therapist.id,
        startDate: start,
        endDate: end,
        reason: reason ?? null,
      },
    });

    return leave;
  }
}

export default new TherapistLeaveService();
