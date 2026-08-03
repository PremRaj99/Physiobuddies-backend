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
  patient?: {
    patientId?: string | null;
    details?: Array<{ name?: string; dob?: Date; gender?: string }>;
  } | null;
  treatmentSession?: {
    status?: string;
  } | null;
}

export const formatTherapistBookings = (
  reservations: FormattableTherapistBooking[],
  defaultMode: string,
) => {
  return reservations.map((res) => {
    const patientDetail = res.patient?.details?.[0];
    const dob = patientDetail?.dob;
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

    const dateStr = formatDateStr(res.date);
    const startHourNum = res.startHour || new Date(res.startTime).getHours();
    const timeStr = formatScheduledTime(startHourNum);
    const statusFormatted = resolveBookingStatus(
      res.status,
      res.startTime,
      res.treatmentSession?.status,
    );

    return {
      id: res.id,
      patientID: res.patient?.patientId || 'PAT-101',
      patientName: patientDetail?.name || 'Patient',
      patientGender:
        (patientDetail?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      patientAge: age,
      treatmentMode: defaultMode || 'home_visit',
      status: statusFormatted,
      lastSessionDate: dateStr,
      lastSessionTime: timeStr,
    };
  });
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
