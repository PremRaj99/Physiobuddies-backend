import { NotFoundError } from '@/core/errors/ApiError';
import {
  formatScheduledTime,
  formatDateStr,
  resolveBookingStatus,
  buildImprovementRecords,
} from '@/core/utils/booking.utils';

export const THERAPIST_BOOKING_RESERVATION_INCLUDE = {
  patient: {
    include: {
      details: true,
      locations: true,
    },
  },
};

export interface FormattableTherapistBooking {
  id: string;
  date: Date | string;
  startTime: Date | string;
  startHour?: number | null;
  status: string;
  treatmentSession?: {
    status?: string | null;
    treatmentPlan?: {
      patientDetailId?: string | null;
      patient?: {
        patientId?: string | null;
        details?: {
          id: string;
          name: string;
          dob: Date | string;
          gender: string;
          phone?: string;
        }[];
      } | null;
    } | null;
  } | null;
}

export const formatTherapistBookings = (
  reservations: FormattableTherapistBooking[],
  defaultMode: string,
) => {
  const currentYear = new Date().getFullYear();
  const formattedBookings = [];

  for (let i = 0; i < reservations.length; i++) {
    const res = reservations[i];
    if (!res) {
      continue;
    }
    const treatmentSession = res.treatmentSession;
    const treatmentPlan = treatmentSession?.treatmentPlan;
    const patient = treatmentPlan?.patient;
    const patientDetailId = treatmentPlan?.patientDetailId;
    const details = patient?.details;

    if (!details || !patientDetailId) {
      continue;
    }

    const patientDetail = details.find((detail) => detail.id === patientDetailId);
    if (!patientDetail) {
      continue;
    }

    const dob = patientDetail.dob;
    const dobYear =
      dob instanceof Date ? dob.getFullYear() : dob ? new Date(dob).getFullYear() : null;
    const age = dobYear !== null && !isNaN(dobYear) ? currentYear - dobYear : null;

    const dateStr = formatDateStr(res.date);
    const startHourNum =
      res.startHour ||
      (res.startTime instanceof Date
        ? res.startTime.getHours()
        : new Date(res.startTime).getHours());
    const timeStr = formatScheduledTime(startHourNum);
    const statusFormatted = resolveBookingStatus(
      res.status,
      res.startTime,
      treatmentSession?.status,
    );

    formattedBookings.push({
      id: res.id,
      patientID: patient?.patientId ?? '',
      patientName: patientDetail.name,
      patientGender: patientDetail.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
      patientAge: age,
      treatmentMode: defaultMode,
      status: statusFormatted,
      lastSessionDate: dateStr,
      lastSessionTime: timeStr,
    });
  }

  return formattedBookings;
};

export interface FormattableDetailSessionReservation {
  startHour?: number | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  date?: Date | string | null;
}

export interface FormattableDetailSession {
  id: string;
  date: Date | string;
  status: string;
  actualStartTime?: Date | string | null;
  actualEndTime?: Date | string | null;
  reservation?: FormattableDetailSessionReservation | null;
  improvementRecord?: unknown;
}

export interface FormattableDetailPatientDetail {
  id: string;
  name: string;
  dob: Date | string;
  gender: string;
}

export interface FormattableDetailPatientLocation {
  id: string;
  address: string;
  landmark?: string | null;
  city: string;
  state: string;
  country?: string | null;
  postalCode: string;
  location?: unknown;
}

export interface FormattableDetailPatient {
  patientId: string;
  details?: FormattableDetailPatientDetail[];
  locations?: FormattableDetailPatientLocation[];
}

export interface FormattableDetailTreatmentPlan {
  id: string;
  status: string;
  patientDetailId?: string | null;
  locationId?: string | null;
  patient?: FormattableDetailPatient | null;
  sessions?: FormattableDetailSession[];
  clinicalAssessments?: unknown[];
  docRecords?: unknown[];
}

export interface FormattableTherapistTreatmentSession {
  condition?: string | null;
  DescribedAs?: string | null;
  treatmentPlan?: FormattableDetailTreatmentPlan | null;
}

export interface FormattableTherapistBookingDetailReservation {
  therapistId: string;
  therapist: {
    mode: string;
  };
  treatmentSession?: FormattableTherapistTreatmentSession | null;
}

export const formatTherapistBookingDetail = (res: FormattableTherapistBookingDetailReservation) => {
  const treatmentPlan = res.treatmentSession?.treatmentPlan;
  const treatmentSessions = treatmentPlan?.sessions;
  if (!treatmentSessions || treatmentSessions.length === 0) {
    throw new NotFoundError('Treatment Sessions not found');
  }

  const patient = treatmentPlan?.patient;
  const details = patient?.details;
  const locations = patient?.locations;

  const patientDetail = details?.find((d) => d.id === treatmentPlan?.patientDetailId);
  if (!patientDetail) {
    throw new NotFoundError('Patient Detail not found');
  }

  const patientLocation = locations?.find((l) => l.id === treatmentPlan?.locationId);
  if (!patientLocation) {
    throw new NotFoundError('Patient Location not found');
  }

  const latestSession = treatmentSessions[treatmentSessions.length - 1];
  if (!latestSession) {
    throw new NotFoundError('Latest Session not found');
  }

  const dobStr = patientDetail.dob ? formatDateStr(patientDetail.dob) : '';
  const statusFormatted = resolveBookingStatus(
    treatmentPlan?.status || 'BOOKED',
    latestSession.reservation?.startTime || latestSession.date || new Date(),
  );

  const sessions = treatmentSessions.map((session) => {
    const reservationStartHour =
      session.reservation?.startHour ??
      (session.reservation?.startTime
        ? new Date(session.reservation.startTime).getHours()
        : new Date(session.date).getHours());

    return {
      id: session.id,
      date: new Date(session.date).toISOString(),
      scheduledTime: formatScheduledTime(reservationStartHour),
      actualStartTime: session.actualStartTime
        ? new Date(session.actualStartTime).toISOString()
        : undefined,
      actualEndTime: session.actualEndTime
        ? new Date(session.actualEndTime).toISOString()
        : undefined,
      status: resolveBookingStatus(session.status, session.reservation?.startTime || session.date),
    };
  });

  const improvementRecords = buildImprovementRecords(treatmentSessions);

  return {
    id: treatmentPlan?.id || '',
    mode: res.therapist.mode,
    overallStatus: statusFormatted,
    patient: {
      id: patient?.patientId || '',
      name: patientDetail.name,
      dob: dobStr,
      gender: (patientDetail.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
    },
    condition: {
      title: res.treatmentSession?.condition || 'Physical Therapy Session',
    },
    problemDescription:
      res.treatmentSession?.DescribedAs || 'Scheduled therapy session with patient.',
    location: {
      address: patientLocation.address || '',
      landmark: patientLocation.landmark || '',
      city: patientLocation.city || '',
      state: patientLocation.state || '',
      postalCode: patientLocation.postalCode || '',
    },
    sessions,
    documents: treatmentPlan?.docRecords || [],
    clinicalAssessments: treatmentPlan?.clinicalAssessments || [],
    improvementRecords,
  };
};
