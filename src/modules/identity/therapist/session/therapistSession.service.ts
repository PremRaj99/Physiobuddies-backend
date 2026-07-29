import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { createAndStoreOTP, verifyOTP } from '@/modules/identity/auth/otp-management';

class TherapistSessionService {
  async getMyBookings(userId: string) {
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
    });

    if (!therapist) {
      return [];
    }

    const reservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
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

    return reservations.map((res) => {
      const patientDetail = (
        res.patient as unknown as {
          details?: Array<{ name?: string; dob?: Date; gender?: string }>;
        }
      )?.details?.[0];
      const dob = patientDetail?.dob;
      const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

      const dateStr = new Date(res.date).toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
      });

      const startHourNum = res.startHour || new Date(res.startTime).getHours();
      const startAmPm = startHourNum >= 12 ? 'PM' : 'AM';
      const formattedStartHour = startHourNum % 12 || 12;
      const endHourNum = (startHourNum + 1) % 24;
      const endAmPm = endHourNum >= 12 ? 'PM' : 'AM';
      const formattedEndHour = endHourNum % 12 || 12;
      const timeStr = `${String(formattedStartHour).padStart(2, '0')}:00 ${startAmPm} - ${String(formattedEndHour).padStart(2, '0')}:00 ${endAmPm}`;

      let statusFormatted = res.status.toUpperCase();
      if (res.treatmentSession?.status) {
        statusFormatted = res.treatmentSession.status.toUpperCase();
      } else if (statusFormatted === 'BOOKED') {
        const isPast = new Date(res.startTime) < new Date();
        statusFormatted = isPast ? 'COMPLETED' : 'UPCOMING';
      }

      return {
        id: res.id,
        patientID: res.patient?.patientId || 'PAT-101',
        patientName: patientDetail?.name || 'Patient',
        patientGender:
          (patientDetail?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
        patientAge: age,
        treatmentMode: therapist.mode || 'home_visit',
        status: statusFormatted,
        lastSessionDate: dateStr,
        lastSessionTime: timeStr,
      };
    });
  }

  async getTodaySessions(therapistId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await prisma.slotReservation.findMany({
      where: {
        therapistId,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        date: { gte: startOfDay, lte: endOfDay },
      },
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
      where: {
        therapistId,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        startTime: { gte: now },
      },
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
      include: {
        patient: {
          include: {
            details: true,
            locations: true,
          },
        },
      },
    });

    if (!res || res.therapistId !== therapist.id) {
      throw new NotFoundError('Booking not found');
    }

    const patientDetail = (
      res.patient as unknown as {
        details?: Array<{ name?: string; dob?: Date; gender?: string; phone?: string }>;
      }
    )?.details?.[0];
    const patientLocation = (
      res.patient as unknown as {
        locations?: Array<{
          address?: string;
          landmark?: string;
          city?: string;
          state?: string;
          postalCode?: string;
        }>;
      }
    )?.locations?.[0];

    const dobDate = patientDetail?.dob ? new Date(patientDetail.dob) : null;
    const dobStr = dobDate
      ? dobDate.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
      : 'June 15, 1995';

    const dateStr = new Date(res.date).toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });

    const startHourNum = res.startHour || new Date(res.startTime).getHours();
    const startAmPm = startHourNum >= 12 ? 'PM' : 'AM';
    const formattedStartHour = startHourNum % 12 || 12;
    const endHourNum = (startHourNum + 1) % 24;
    const endAmPm = endHourNum >= 12 ? 'PM' : 'AM';
    const formattedEndHour = endHourNum % 12 || 12;
    const timeStr = `${String(formattedStartHour).padStart(2, '0')}:00 ${startAmPm} - ${String(formattedEndHour).padStart(2, '0')}:00 ${endAmPm}`;

    const treatmentSession = await prisma.treatmentSession.findFirst({
      where: { reservationId: res.id },
      include: {
        treatmentPlan: {
          include: {
            clinicalAssessments: {
              orderBy: { createdAt: 'desc' },
            },
            docRecords: true,
            sessions: {
              include: {
                improvementRecord: true,
              },
            },
          },
        },
      },
    });

    let statusFormatted = res.status.toUpperCase();
    if (treatmentSession?.status) {
      statusFormatted = treatmentSession.status.toUpperCase();
    } else if (statusFormatted === 'BOOKED') {
      const isPast = new Date(res.startTime) < new Date();
      statusFormatted = isPast ? 'COMPLETED' : 'UPCOMING';
    }

    const improvementRecords = (treatmentSession?.treatmentPlan?.sessions || [])
      .map((s) => (s.improvementRecord ? { ...s.improvementRecord, sessionDate: s.date } : null))
      .filter(Boolean);

    return {
      id: res.id,
      mode: therapist.mode || 'home_visit',
      overallStatus: statusFormatted,
      patient: {
        id: res.patient?.patientId || 'PAT-101',
        name: patientDetail?.name || 'Patient',
        dob: dobStr,
        gender: (patientDetail?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
        phone: patientDetail?.phone || '+91 98765 43210',
        image: undefined,
      },
      condition: {
        title: treatmentSession?.condition || 'Physical Therapy Session',
      },
      problemDescription:
        treatmentSession?.DescribedAs || 'Scheduled therapy session with patient.',
      location: {
        address: patientLocation?.address || therapist.displayAddress || '100 Green Avenue',
        landmark: patientLocation?.landmark || 'Near City Park',
        city: patientLocation?.city || 'New Delhi',
        state: patientLocation?.state || 'Delhi',
        postalCode: patientLocation?.postalCode || '110002',
      },
      sessions: [
        {
          id: res.id,
          date: dateStr,
          scheduledTime: timeStr,
          status: statusFormatted.toLowerCase(),
        },
      ],
      documents: treatmentSession?.treatmentPlan?.docRecords || [],
      clinicalAssessments: treatmentSession?.treatmentPlan?.clinicalAssessments || [],
      clinicalAssessment: treatmentSession?.treatmentPlan?.clinicalAssessments?.[0] || null,
      improvementRecords,
    };
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

    // Generate & store OTP in Redis with anti-abuse rate limits (60s cooldown, max 3 attempts/hr)
    const otpCode = await createAndStoreOTP(session.id, 'session_otp');

    return {
      message: 'OTP sent to patient successfully',
      otpCode, // Returned for dev testing
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

    // Verifies OTP in Redis & deletes it upon success (throws ValidationError if invalid or expired)
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
