import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { getTodayISTRange } from '@/core/utils/time-zone';

class PatientService {
  startOfToday = () => {
    const { startUtc } = getTodayISTRange();
    return startUtc;
  };

  endOfToday = () => {
    const { endUtc } = getTodayISTRange();
    return endUtc;
  };

  // Implement patient-specific business logic here
  getPatientById = async (patientId: string) => {
    // Implementation to get patient by ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId, deletedAt: { isSet: false } },
    });
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  };

  getPatientByUserId = async (userId: string) => {
    // Implementation to get patient by user ID
    const patient = await prisma.patient.findFirst({
      where: { userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  };

  patientInfo = async (userId: string) => {
    const patient = await prisma.patient.findFirst({
      where: { userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        details: {
          orderBy: { updatedAt: 'desc' },
          take: 2,
          select: {
            id: true,
            dob: true,
            name: true,
            gender: true,
            phone: true,
          },
        },
        locations: {
          orderBy: { updatedAt: 'desc' },
          take: 2,
          select: {
            id: true,
            address: true,
            landmark: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
        treatmentPlans: {
          orderBy: { updatedAt: 'desc' },
          take: 2,
          select: {
            id: true,
            sessions: {
              where: {
                date: { gte: this.startOfToday(), lt: this.endOfToday() },
              },
              orderBy: { date: 'asc' },
              take: 4,
              select: {
                reservation: {
                  select: {
                    date: true,
                    startTime: true,
                    endTime: true,
                  },
                },
                status: true,
              },
            },
            status: true,
          },
        },
        reservations: {
          where: {
            date: {
              gte: this.startOfToday(),
              lt: this.endOfToday(),
            },
            OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
          },
          orderBy: { startHour: 'asc' },
          select: {
            id: true,
            date: true,
            therapist: {
              select: {
                user: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
                gender: true,
              },
            },
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    return {
      id: patient.id,
      user: patient.user,
      details: patient.details,
      treatmentPlans: patient.treatmentPlans.map((treatmentPlan) => ({
        id: treatmentPlan.id,
        status: treatmentPlan.status,
        sessions: treatmentPlan.sessions.map((session) => ({
          date: session.reservation?.date,
          startTime: session.reservation.startTime,
          endTime: session.reservation.endTime,
          status: session.status,
        })),
      })),
      locations: patient.locations,
      reservations: patient.reservations.map((reservation) => ({
        id: reservation.id,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        therapist: reservation.therapist?.user
          ? {
              name: reservation.therapist.user.name,
              gender: reservation.therapist.gender,
              image: reservation.therapist.user.image,
            }
          : null,
      })),
      createdAt: patient.createdAt,
    };
  };

  getMyBookings = async (userId: string) => {
    const patient = await prisma.patient.findFirst({
      where: { userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });

    if (!patient) {
      return [];
    }

    const reservations = await prisma.slotReservation.findMany({
      where: {
        patientId: patient.id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      include: {
        therapist: {
          include: {
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return reservations.map((res) => {
      const dateStr = new Date(res.date).toLocaleDateString('en-US', {
        month: 'short',
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
        therapistId: res.therapistId,
        therapistName: res.therapist?.user?.name || 'Therapist',
        therapistImage: res.therapist?.user?.image || '',
        therapistGender:
          (res.therapist?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
        treatmentMode: res.therapist?.mode || 'home_visit',
        status: statusFormatted,
        lastSessionDate: dateStr,
        lastSessionTime: timeStr,
      };
    });
  };
}

export const patientService = new PatientService();
