import {
  formatScheduledTime,
  formatDateStr,
  resolveBookingStatus,
  TREATMENT_SESSION_WITH_PLAN_INCLUDE,
  buildImprovementRecords,
} from '@/core/utils/booking.utils';
import { softDeleteWhereClause } from '@/core/utils/softdelete';

export const buildPatientInfoInclude = (startOfToday: Date, endOfToday: Date) => ({
  user: {
    select: {
      name: true,
      email: true,
      phone: true,
    },
  },
  details: {
    orderBy: { updatedAt: 'desc' as const },
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
    orderBy: { updatedAt: 'desc' as const },
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
    orderBy: { updatedAt: 'desc' as const },
    take: 2,
    select: {
      id: true,
      sessions: {
        where: {
          date: { gte: startOfToday, lt: endOfToday },
        },
        orderBy: { date: 'asc' as const },
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
    where: softDeleteWhereClause({
      date: {
        gte: startOfToday,
        lt: endOfToday,
      },
    }),
    orderBy: { startHour: 'asc' as const },
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
});

export const PATIENT_BOOKING_RESERVATION_INCLUDE = {
  therapist: {
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  },
  patient: {
    include: {
      details: {
        orderBy: { updatedAt: 'desc' as const },
      },
      locations: {
        orderBy: { updatedAt: 'desc' as const },
      },
    },
  },
  treatmentSession: TREATMENT_SESSION_WITH_PLAN_INCLUDE,
};

export interface FormattablePatientInfo {
  id: string;
  user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  details?: Array<{
    id: string;
    dob?: Date | null;
    name?: string | null;
    gender?: string | null;
    phone?: string | null;
  }> | null;
  treatmentPlans?: Array<{
    id: string;
    status: string;
    sessions?: Array<{
      reservation?: { date?: Date | null; startTime?: Date | null; endTime?: Date | null } | null;
      status: string;
    }> | null;
  }> | null;
  locations?: Array<{
    id: string;
    address?: string | null;
    landmark?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  }> | null;
  reservations?: Array<{
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    status: string;
    therapist?: {
      user?: { name?: string | null; image?: string | null } | null;
      gender?: string | null;
    } | null;
  }> | null;
  createdAt: Date;
}

export const formatPatientInfo = (patient: FormattablePatientInfo) => {
  return {
    id: patient.id,
    user: patient.user,
    details: patient.details,
    treatmentPlans: patient.treatmentPlans?.map((treatmentPlan) => ({
      id: treatmentPlan.id,
      status: treatmentPlan.status,
      sessions: treatmentPlan.sessions?.map((session) => ({
        date: session.reservation?.date,
        startTime: session.reservation?.startTime,
        endTime: session.reservation?.endTime,
        status: session.status,
      })),
    })),
    locations: patient.locations,
    reservations: patient.reservations?.map((reservation) => ({
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

export interface FormattablePatientBooking {
  id: string;
  date: Date | string;
  startTime: Date | string;
  startHour?: number | null;
  status: string;
  therapistId: string;
  therapist?: {
    gender?: string | null;
    mode?: string | null;
    user?: {
      name?: string | null;
      image?: string | null;
    } | null;
  } | null;
}

export const formatPatientBookings = (reservations: FormattablePatientBooking[]) => {
  return reservations.map((res) => {
    const dateStr = formatDateStr(res.date, 'short');
    const startHourNum = res.startHour || new Date(res.startTime).getHours();
    const timeStr = formatScheduledTime(startHourNum);
    const statusFormatted = resolveBookingStatus(res.status, res.startTime);

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

export interface FormattableBookingReservation {
  id: string;
  status: string;
  startTime: Date;
  startHour?: number | null;
  date: Date;
  patientId?: string | null;
  therapistId?: string;
  patient?: {
    id?: string;
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
      country?: string | null;
      location?: unknown;
    }>;
  } | null;
  therapist?: {
    id?: string;
    therapistId?: string;
    displayAddress?: string | null;
    mode?: string | null;
    gender?: string | null;
    rating?: number | null;
    user?: { name?: string | null; image?: string | null } | null;
  } | null;
}

export interface FormattableTreatmentSession {
  id?: string;
  mode?: string | null;
  status?: string | null;
  condition?: string | null;
  DescribedAs?: string | null;
  actualStartTime?: Date | null;
  actualEndTime?: Date | null;
  treatmentPlan?: {
    id?: string;
    sessions?: Array<{
      id: string;
      date: Date;
      status: string;
      actualStartTime?: Date | null;
      actualEndTime?: Date | null;
      reservation?: { startHour?: number | null; startTime?: Date | null };
      improvementData?: unknown;
    }>;
    docRecords?: Array<{
      id: string;
      name: string;
      fileType: string;
      url: string;
      createdAt: Date;
    }>;
    clinicalAssessments?: unknown[];
  } | null;
}

export interface FormattableFallbackPatient {
  id: string;
}

export const formatPatientBookingDetail = (
  reservation: FormattableBookingReservation,
  treatmentSession: FormattableTreatmentSession | null | undefined,
  fallbackPatient: FormattableFallbackPatient,
) => {
  const patientDetail = reservation.patient?.details?.[0];
  const patientLocation = reservation.patient?.locations?.[0];
  const treatmentPlan = treatmentSession?.treatmentPlan;

  const overallStatus = resolveBookingStatus(
    reservation.status,
    reservation.startTime,
    treatmentSession?.status,
  );

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
      id: treatmentSession?.id || reservation.id,
      date: reservation.date.toISOString(),
      scheduledTime: formatScheduledTime(
        reservation.startHour || new Date(reservation.startTime).getHours(),
      ),
      actualStartTime: treatmentSession?.actualStartTime?.toISOString(),
      actualEndTime: treatmentSession?.actualEndTime?.toISOString(),
      status: overallStatus,
    },
  ];

  const improvementRecords = buildImprovementRecords(treatmentPlan?.sessions);

  return {
    id: reservation.id,
    treatmentPlanId: treatmentPlan?.id,
    mode: reservation.therapist?.mode || treatmentSession?.mode || 'home_visit',
    overallStatus,
    status: overallStatus,
    therapist: {
      id: reservation.therapist?.id || '',
      therapistId: reservation.therapist?.therapistId || reservation.therapist?.id || '',
      name: reservation.therapist?.user?.name || 'Therapist',
      image: reservation.therapist?.user?.image || '',
      gender:
        (reservation.therapist?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      rating: reservation.therapist?.rating || 4.8,
    },
    patient: {
      id: reservation.patient?.id || fallbackPatient.id,
      name: patientDetail?.name || 'Patient',
      dob: patientDetail?.dob?.toISOString(),
      gender: (patientDetail?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      phone: patientDetail?.phone || '',
    },
    condition: {
      title: treatmentSession?.condition || 'Physical Therapy Session',
    },
    problemDescription: treatmentSession?.DescribedAs || '',
    location: {
      address: patientLocation?.address || reservation.therapist?.displayAddress || '',
      landmark: patientLocation?.landmark || null,
      city: patientLocation?.city || '',
      state: patientLocation?.state || '',
      postalCode: patientLocation?.postalCode || '',
      country: patientLocation?.country || '',
      coords:
        (patientLocation?.location as { lat?: number; lng?: number } | undefined) || undefined,
    },
    sessions,
    documents:
      treatmentPlan?.docRecords?.map((document) => ({
        id: document.id,
        name: document.name,
        fileType: document.fileType,
        url: document.url,
        createdAt: document.createdAt.toISOString(),
      })) || [],
    clinicalAssessments: treatmentPlan?.clinicalAssessments || [],
    improvementRecords,
  };
};
