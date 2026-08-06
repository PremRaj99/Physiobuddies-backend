import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { NotFoundError } from '@/core/errors/ApiError';
import { getTodayISTRange } from '@/core/utils/time-zone';
import {
  buildPatientInfoInclude,
  formatPatientInfo,
  formatPatientBookings,
  formatPatientBookingDetail,
} from './patient.helper';

class PatientService {
  startOfToday = () => {
    const { startUtc } = getTodayISTRange();
    return startUtc;
  };

  endOfToday = () => {
    const { endUtc } = getTodayISTRange();
    return endUtc;
  };

  getPatientById = async (patientId: string) => {
    const patient = await prisma.patient.findFirst({
      where: softDeleteWhereClause({ id: patientId }),
    });
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  };

  getPatientByUserId = async (userId: string) => {
    const patient = await prisma.patient.findFirst({
      where: softDeleteWhereClause({ userId }),
    });
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  };

  patientInfo = async (userId: string) => {
    const patient = await prisma.patient.findFirst({
      where: softDeleteWhereClause({ userId }),
      include: buildPatientInfoInclude(this.startOfToday(), this.endOfToday()),
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    return formatPatientInfo(patient);
  };

  getMyBookings = async (userId: string) => {
    const plans = await prisma.treatmentPlan.findMany({
      where: {
        patient: softDeleteWhereClause({ userId }),
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        therapistId: true,
        therapist: {
          select: {
            mode: true,
            gender: true,
            user: {
              select: { name: true, image: true },
            },
          },
        },
        sessions: {
          select: {
            id: true,
            date: true,
            status: true,
            mode: true,
            reservation: {
              select: {
                id: true,
                date: true,
                startTime: true,
                startHour: true,
                status: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return formatPatientBookings(plans);
  };

  getBookingById = async (userId: string, bookingId: string) => {
    const patient = await prisma.patient.findFirst({
      where: softDeleteWhereClause({ userId }),
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    const plan = await prisma.treatmentPlan.findFirst({
      where: {
        OR: [
          { id: bookingId },
          { sessions: { some: { id: bookingId } } },
          { slotReservations: { some: { id: bookingId } } },
        ],
        patientId: patient.id,
      },
      include: {
        patient: {
          include: {
            details: { take: 1, orderBy: { createdAt: 'desc' } },
            locations: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
        therapist: {
          include: {
            user: { select: { name: true, image: true } },
          },
        },
        sessions: {
          include: {
            reservation: true,
            improvementRecord: true,
          },
          orderBy: { date: 'desc' },
        },
        docRecords: {
          orderBy: { createdAt: 'desc' },
        },
        clinicalAssessments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Booking / Treatment Plan not found');
    }

    return formatPatientBookingDetail(plan, patient);
  };
}

export const patientService = new PatientService();
