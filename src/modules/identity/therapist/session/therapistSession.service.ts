import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { createAndStoreOTP, verifyOTP } from '@/modules/identity/auth/otp-management';
import {
  TREATMENT_PLAN_INCLUDE,
  TREATMENT_SESSION_WITH_PLAN_INCLUDE,
} from '@/core/utils/booking.utils';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import {
  THERAPIST_BOOKING_RESERVATION_INCLUDE,
  formatTherapistBookings,
  formatTherapistBookingDetail,
} from './therapistSession.helper';

class TherapistSessionService {
  async getMyBookings(userId: string) {
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
    });

    if (!therapist) {
      return [];
    }

    const reservations = await prisma.slotReservation.findMany({
      where: softDeleteWhereClause({
        therapistId: therapist.id,
      }),
      include: {
        patient: {
          include: {
            details: true,
          },
        },
        treatmentSession: true,
      },
      orderBy: { startTime: 'desc' },
    });

    return formatTherapistBookings(reservations, therapist.mode);
  }

  async getTodaySessions(therapistId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await prisma.slotReservation.findMany({
      where: softDeleteWhereClause({
        therapistId,
        date: { gte: startOfDay, lte: endOfDay },
      }),
      include: {
        patient: {
          include: { details: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return reservations;
  }

  async getUpcomingSessions(therapistId: string) {
    const now = new Date();

    const reservations = await prisma.slotReservation.findMany({
      where: softDeleteWhereClause({
        therapistId,
        startTime: { gte: now },
      }),
      include: {
        patient: {
          include: { details: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return reservations;
  }

  async getBookingById(userId: string, bookingId: string) {
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }

    const res = await prisma.slotReservation.findUnique({
      where: { id: bookingId },
      include: THERAPIST_BOOKING_RESERVATION_INCLUDE,
    });

    if (!res || res.therapistId !== therapist.id) {
      throw new NotFoundError('Booking not found');
    }

    const treatmentSession = await prisma.treatmentSession.findFirst({
      where: { reservationId: res.id },
      ...TREATMENT_SESSION_WITH_PLAN_INCLUDE,
    });

    let treatmentPlan = treatmentSession?.treatmentPlan;

    if (!treatmentPlan && res.patientId) {
      const foundPlan = await prisma.treatmentPlan.findFirst({
        where: {
          patientId: res.patientId,
          therapistId: res.therapistId,
        },
        ...TREATMENT_PLAN_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });

      if (foundPlan) {
        treatmentPlan = foundPlan;
      }
    }

    return formatTherapistBookingDetail(res, therapist, treatmentSession, treatmentPlan);
  }

  async acceptBooking(userId: string, bookingId: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) throw new NotFoundError('Therapist not found');

    const res = await prisma.slotReservation.findUnique({ where: { id: bookingId } });
    if (!res || res.therapistId !== therapist.id) throw new NotFoundError('Booking not found');

    await prisma.slotReservation.update({
      where: { id: bookingId },
      data: { status: 'booked' },
    });

    const session = await prisma.treatmentSession.findFirst({
      where: { reservationId: bookingId },
    });
    if (session) {
      await prisma.treatmentSession.update({
        where: { id: session.id },
        data: { status: 'confirmed' },
      });
    }

    return { message: 'Booking accepted successfully' };
  }

  async generateSessionOtp(userId: string, bookingId: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) throw new NotFoundError('Therapist not found');

    let session = await prisma.treatmentSession.findFirst({
      where: { reservationId: bookingId },
    });

    if (!session) {
      session = await prisma.treatmentSession.findUnique({
        where: { id: bookingId },
      });
    }

    if (!session) throw new NotFoundError('Session not found');

    const otpCode = await createAndStoreOTP(session.id, 'session_otp');

    return {
      message: 'OTP sent to patient successfully',
      otpCode,
      expiresInMinutes: 5,
    };
  }

  async verifySessionOtp(userId: string, bookingId: string, otp: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) throw new NotFoundError('Therapist not found');

    let session = await prisma.treatmentSession.findFirst({
      where: { reservationId: bookingId },
    });

    if (!session) {
      session = await prisma.treatmentSession.findUnique({
        where: { id: bookingId },
      });
    }

    if (!session) throw new NotFoundError('Session not found');

    await verifyOTP(session.id, otp, 'session_otp');

    const now = new Date();
    const updated = await prisma.treatmentSession.update({
      where: { id: session.id },
      data: {
        status: 'active',
        actualStartTime: now,
      },
    });

    await prisma.treatmentSessionStatusLog.create({
      data: {
        sessionId: session.id,
        fromStatus: session.status,
        toStatus: 'active',
        changedBy: 'therapist',
        changedByUserId: therapist.userId,
        reason: 'OTP Verified by Therapist via Redis',
      },
    });

    return {
      message: 'OTP verified successfully. Session is now active.',
      session: updated,
    };
  }

  async endSession(userId: string, bookingId: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) throw new NotFoundError('Therapist not found');

    let session = await prisma.treatmentSession.findFirst({
      where: { reservationId: bookingId },
    });

    if (!session) {
      session = await prisma.treatmentSession.findUnique({
        where: { id: bookingId },
      });
    }

    if (!session) throw new NotFoundError('Session not found');

    const now = new Date();
    const startTime = session.actualStartTime || session.startAt || session.createdAt;
    const durationMinutes = Math.round((now.getTime() - new Date(startTime).getTime()) / 60000);

    const updated = await prisma.treatmentSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        endAt: now,
        actualEndTime: now,
      },
    });

    await prisma.treatmentSessionStatusLog.create({
      data: {
        sessionId: session.id,
        fromStatus: session.status,
        toStatus: 'completed',
        changedBy: 'therapist',
        changedByUserId: therapist.userId,
        reason: 'Session Ended by Therapist',
      },
    });

    return {
      message: 'Session completed successfully.',
      durationMinutes,
      session: updated,
    };
  }

  async completeTreatmentPlan(
    userId: string,
    planId: string,
    payload: { beforeTherapyImg?: string; afterTherapyImg?: string; finalImprovement?: string },
  ) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) throw new NotFoundError('Therapist not found');

    const plan = await prisma.treatmentPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.therapistId !== therapist.id)
      throw new NotFoundError('Treatment plan not found');

    const updated = await prisma.treatmentPlan.update({
      where: { id: planId },
      data: {
        status: 'completed',
        ...(payload.beforeTherapyImg !== undefined && {
          beforeTherapyImg: payload.beforeTherapyImg,
        }),
        ...(payload.afterTherapyImg !== undefined && { afterTherapyImg: payload.afterTherapyImg }),
        ...(payload.finalImprovement !== undefined && {
          finalImprovement: payload.finalImprovement,
        }),
      },
    });

    await prisma.treatmentPlanStatusLog.create({
      data: {
        treatmentPlanId: plan.id,
        fromStatus: plan.status,
        toStatus: 'completed',
        changedBy: 'therapist',
        changedByUserId: therapist.userId,
        reason: 'Treatment Plan Completed by Therapist',
      },
    });

    return {
      message: 'Treatment plan closed & completed successfully.',
      plan: updated,
    };
  }
}

export const therapistSessionService = new TherapistSessionService();
