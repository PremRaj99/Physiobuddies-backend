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

export interface FormattableTherapistBookingDetailReservation {
  id: string;
  date: Date | string;
  startTime: Date | string;
  startHour?: number | null;
  status: string;
  patient?: {
    patientId?: string | null;
    details?: Array<{
      name?: string | null;
      dob?: Date | null;
      gender?: string | null;
      phone?: string | null;
    }>;
    locations?: Array<{
      address?: string | null;
      landmark?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
    }>;
  } | null;
}

export interface FormattableTherapist {
  mode?: string | null;
  displayAddress?: string | null;
}

export interface FormattableTherapistTreatmentSession {
  id?: string;
  status?: string | null;
  condition?: string | null;
  DescribedAs?: string | null;
  actualStartTime?: Date | null;
  actualEndTime?: Date | null;
}

export interface FormattableTherapistTreatmentPlan {
  sessions?: Array<{
    id: string;
    date: Date;
    status: string;
    actualStartTime?: Date | null;
    actualEndTime?: Date | null;
    reservation?: { startHour?: number | null; startTime?: Date | null };
    improvementData?: unknown;
  }>;
  docRecords?: unknown[];
  clinicalAssessments?: unknown[];
}

export const formatTherapistBookingDetail = (
  res: FormattableTherapistBookingDetailReservation,
  therapist: FormattableTherapist,
  treatmentSession: FormattableTherapistTreatmentSession | null | undefined,
  treatmentPlan: FormattableTherapistTreatmentPlan | null | undefined,
) => {
  const patientDetail = res.patient?.details?.[0];
  const patientLocation = res.patient?.locations?.[0];

  const dobStr = patientDetail?.dob ? formatDateStr(patientDetail.dob) : 'June 15, 1995';
  const statusFormatted = resolveBookingStatus(res.status, res.startTime, treatmentSession?.status);

  const sessions = treatmentPlan?.sessions?.map((session) => {
    const reservationStartHour =
      session.reservation?.startHour ||
      new Date(session.reservation?.startTime || session.date).getHours();

    return {
      id: session.id,
      date: session.date.toISOString(),
      scheduledTime: formatScheduledTime(reservationStartHour),
      actualStartTime: session.actualStartTime?.toISOString(),
      actualEndTime: session.actualEndTime?.toISOString(),
      status: resolveBookingStatus(session.status, session.reservation?.startTime || session.date),
    };
  }) || [
    {
      id: treatmentSession?.id || res.id,
      date: new Date(res.date).toISOString(),
      scheduledTime: formatScheduledTime(res.startHour || new Date(res.startTime).getHours()),
      actualStartTime: treatmentSession?.actualStartTime?.toISOString(),
      actualEndTime: treatmentSession?.actualEndTime?.toISOString(),
      status: statusFormatted,
    },
  ];

  const improvementRecords = buildImprovementRecords(treatmentPlan?.sessions);

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
    problemDescription: treatmentSession?.DescribedAs || 'Scheduled therapy session with patient.',
    location: {
      address: patientLocation?.address || therapist.displayAddress || '100 Green Avenue',
      landmark: patientLocation?.landmark || 'Near City Park',
      city: patientLocation?.city || 'New Delhi',
      state: patientLocation?.state || 'Delhi',
      postalCode: patientLocation?.postalCode || '110002',
    },
    sessions,
    documents: treatmentPlan?.docRecords || [],
    clinicalAssessments: treatmentPlan?.clinicalAssessments || [],
    improvementRecords,
  };
};
