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
      where: { id: patientId, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  };

  getPatientByUserId = async (userId: string) => {
    // Implementation to get patient by user ID
    const patient = await prisma.patient.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  };

  patientInfo = async (userId: string) => {
    const patient = await prisma.patient.findFirst({
      where: { userId, deletedAt: null },
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
        appointments: {
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
            deletedAt: null,
          },
          orderBy: { timeSlotTemplate: { startTime: 'asc' } },
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
      appointments: patient.appointments.map((appointment) => ({
        id: appointment.id,
        status: appointment.status,
        sessions: appointment.sessions.map((session) => ({
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
}

export const patientService = new PatientService();
