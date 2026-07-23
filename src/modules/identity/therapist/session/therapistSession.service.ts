import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';

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
      if (statusFormatted === 'BOOKED') {
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

    let statusFormatted = res.status.toUpperCase();
    if (statusFormatted === 'BOOKED') {
      const isPast = new Date(res.startTime) < new Date();
      statusFormatted = isPast ? 'COMPLETED' : 'UPCOMING';
    }

    const treatmentSession = await prisma.treatmentSession.findFirst({
      where: { reservationId: res.id },
      include: {
        treatmentPlan: {
          include: {
            clinicalAssessment: true,
          },
        },
      },
    });

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
      clinicalAssessment: treatmentSession?.treatmentPlan?.clinicalAssessment || null,
    };
  }
}

export const therapistSessionService = new TherapistSessionService();
