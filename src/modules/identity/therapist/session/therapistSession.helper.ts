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

export interface FormattableTherapistTreatmentPlan {
  id: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  sessions?: {
    id: string;
    date: Date | string;
    status: string;
    mode?: string | null;
    reservation?: {
      id?: string;
      date?: Date | string;
      startTime?: Date | string;
      startHour?: number | null;
      status?: string;
    } | null;
  }[];
}

export const formatTherapistBookings = (
  plans: FormattableTherapistTreatmentPlan[],
  defaultMode: string,
) => {
  const currentYear = new Date().getFullYear();
  const formattedBookings = [];

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    if (!plan) {
      continue;
    }

    const patient = plan.patient;
    const patientDetailId = plan.patientDetailId;
    const details = patient?.details;

    if (!details || details.length === 0) {
      continue;
    }

    const patientDetail = patientDetailId
      ? details.find((detail) => detail.id === patientDetailId) || details[0]
      : details[0];
    if (!patientDetail) {
      continue;
    }

    const latestSession = plan.sessions && plan.sessions.length > 0 ? plan.sessions[0] : null;

    const dob = patientDetail.dob;
    const dobYear =
      dob instanceof Date ? dob.getFullYear() : dob ? new Date(dob).getFullYear() : null;
    const age = dobYear !== null && !isNaN(dobYear) ? currentYear - dobYear : null;

    const date =
      latestSession?.reservation?.startTime ||
      latestSession?.date ||
      plan.updatedAt ||
      plan.createdAt;
    const startHourNum =
      latestSession?.reservation?.startHour ??
      (date instanceof Date ? date.getHours() : new Date(date).getHours());

    const dateStr = formatDateStr(date);
    const timeStr = formatScheduledTime(startHourNum);
    const statusFormatted = resolveBookingStatus(plan.status, date, latestSession?.status);

    formattedBookings.push({
      id: plan.id,
      patientID: patient?.patientId ?? '',
      patientName: patientDetail.name,
      patientGender: (patientDetail.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      patientAge: age,
      treatmentMode: latestSession?.mode || defaultMode,
      status: statusFormatted,
      lastSessionDate: dateStr,
      lastSessionTime: timeStr,
    });
  }

  return formattedBookings;
};

export interface FormattableTherapistPlanDetail {
  id: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  patientDetailId?: string | null;
  locationId?: string | null;
  therapistId: string;
  therapist?: {
    mode: string;
  } | null;
  patient?: {
    patientId: string;
    details?: {
      id: string;
      name: string;
      dob: Date | string;
      gender: string;
    }[];
    locations?: {
      id: string;
      address: string;
      landmark?: string | null;
      city: string;
      state: string;
      country?: string | null;
      postalCode: string;
      location?: unknown;
    }[];
  } | null;
  sessions?: {
    id: string;
    date: Date | string;
    status: string;
    mode?: string | null;
    condition?: string | null;
    DescribedAs?: string | null;
    actualStartTime?: Date | string | null;
    actualEndTime?: Date | string | null;
    reservation?: {
      startHour?: number | null;
      startTime?: Date | string | null;
      endTime?: Date | string | null;
      date?: Date | string | null;
    } | null;
    improvementRecord?: unknown;
  }[];
  clinicalAssessments?: unknown[];
  docRecords?: unknown[];
}

export const formatTherapistBookingDetail = (plan: FormattableTherapistPlanDetail) => {
  const treatmentSessions = plan.sessions;

  const patient = plan.patient;
  const details = patient?.details;
  const locations = patient?.locations;

  const patientDetail = details?.find((d) => d.id === plan.patientDetailId) || details?.[0];
  if (!patientDetail) {
    throw new NotFoundError('Patient Detail not found');
  }

  const patientLocation = locations?.find((l) => l.id === plan.locationId) || locations?.[0];

  const latestSession =
    treatmentSessions && treatmentSessions.length > 0 ? treatmentSessions[0] : null;

  const date =
    latestSession?.reservation?.startTime ||
    latestSession?.date ||
    plan.updatedAt ||
    plan.createdAt;

  const dobStr = patientDetail.dob ? formatDateStr(patientDetail.dob) : '';
  const statusFormatted = resolveBookingStatus(plan.status, date, latestSession?.status);

  const sessions = (treatmentSessions || []).map((session) => {
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
    id: plan.id,
    therapistId: plan.therapistId,
    therapist: {
      id: plan.therapistId,
    },
    mode: latestSession?.mode || plan.therapist?.mode || 'home_visit',
    overallStatus: statusFormatted,
    patient: {
      id: patient?.patientId || '',
      name: patientDetail.name,
      dob: dobStr,
      gender: (patientDetail.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
    },
    condition: {
      title: latestSession?.condition || 'Physical Therapy Session',
    },
    problemDescription: latestSession?.DescribedAs || 'Scheduled therapy session with patient.',
    location: {
      address: patientLocation?.address || '',
      landmark: patientLocation?.landmark || '',
      city: patientLocation?.city || '',
      state: patientLocation?.state || '',
      postalCode: patientLocation?.postalCode || '',
    },
    sessions,
    documents: plan.docRecords || [],
    clinicalAssessments: plan.clinicalAssessments || [],
    improvementRecords,
  };
};
