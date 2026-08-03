import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { NotFoundError } from '@/core/errors/ApiError';
import { getTodayISTRange } from '@/core/utils/time-zone';
import { TREATMENT_SESSION_WITH_PLAN_INCLUDE } from '@/core/utils/booking.utils';
import {
  buildPatientInfoInclude,
  PATIENT_BOOKING_RESERVATION_INCLUDE,
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
    const reservations = await prisma.slotReservation.findMany({
      where: softDeleteWhereClause({
        patient: softDeleteWhereClause({ userId }),
      }),
      select: {
        id: true,
        date: true,
        startTime: true,
        startHour: true,
        status: true,
        therapistId: true,
        treatmentSession: {
          select: {
            status: true,
          },
        },
        therapist: {
          select: {
            mode: true,
            gender: true,
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return formatPatientBookings(reservations);
  };

  getBookingById = async (userId: string, bookingId: string) => {
    const patient = await prisma.patient.findFirst({
      where: softDeleteWhereClause({ userId }),
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    const reservation = await prisma.slotReservation.findUnique({
      where: { id: bookingId },
      include: PATIENT_BOOKING_RESERVATION_INCLUDE,
    });

    if (!reservation || reservation.patientId !== patient.id) {
      throw new NotFoundError('Booking not found');
    }

    let treatmentSession = reservation.treatmentSession;
    if (!treatmentSession) {
      treatmentSession = await prisma.treatmentSession.findFirst({
        where: { reservationId: reservation.id },
        ...TREATMENT_SESSION_WITH_PLAN_INCLUDE,
      });
    }

    return formatPatientBookingDetail(reservation, treatmentSession, patient);
  };
}

export const patientService = new PatientService();
