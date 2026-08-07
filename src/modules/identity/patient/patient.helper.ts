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

export interface FormattablePatientTreatmentPlan {
  id: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  therapistId: string;
  therapist?: {
    gender?: string | null;
    mode?: string | null;
    user?: {
      name?: string | null;
      image?: string | null;
    } | null;
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

export const formatPatientBookings = (plans: FormattablePatientTreatmentPlan[]) => {
  return plans.map((plan) => {
    const { id, status, therapistId, therapist, sessions, updatedAt, createdAt } = plan;

    const latestSession = sessions && sessions.length > 0 ? sessions[0] : null;

    const date =
      latestSession?.reservation?.startTime || latestSession?.date || updatedAt || createdAt;
    const startHour =
      latestSession?.reservation?.startHour ?? (date ? new Date(date).getHours() : 9);

    const dateStr = formatDateStr(date, 'short');
    const timeStr = formatScheduledTime(startHour);
    const statusFormatted = resolveBookingStatus(status, date, latestSession?.status);

    return {
      id,
      therapistId,
      therapistName: therapist?.user?.name || 'Therapist',
      therapistImage: therapist?.user?.image || '',
      therapistGender: (therapist?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      treatmentMode: latestSession?.mode || therapist?.mode || 'home_visit',
      status: statusFormatted,
      lastSessionDate: dateStr,
      lastSessionTime: timeStr,
    };
  });
};

export interface FormattablePatientPlanDetail {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  patientId: string;
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
  sessions?: Array<{
    id: string;
    date: Date;
    status: string;
    mode?: string | null;
    condition?: string | null;
    DescribedAs?: string | null;
    actualStartTime?: Date | null;
    actualEndTime?: Date | null;
    reservation?: { startHour?: number | null; startTime?: Date | null } | null;
    improvementRecord?: unknown;
  }>;
  docRecords?: Array<{
    id: string;
    name: string;
    fileType: string;
    url: string;
    createdAt: Date;
  }>;
  clinicalAssessments?: unknown[];
}

export const formatPatientBookingDetail = (
  plan: FormattablePatientPlanDetail,
  fallbackPatient?: { id: string },
) => {
  const patientDetail = plan.patient?.details?.[0];
  const patientLocation = plan.patient?.locations?.[0];

  const latestSession = plan.sessions && plan.sessions.length > 0 ? plan.sessions[0] : null;

  const date =
    latestSession?.reservation?.startTime ||
    latestSession?.date ||
    plan.updatedAt ||
    plan.createdAt;

  const overallStatus = resolveBookingStatus(plan.status, date, latestSession?.status);

  const sessions =
    plan.sessions?.map((session) => {
      const reservationStartHour =
        session.reservation?.startHour ||
        (session.reservation?.startTime
          ? new Date(session.reservation.startTime).getHours()
          : new Date(session.date).getHours());

      return {
        id: session.id,
        date:
          session.date instanceof Date
            ? session.date.toISOString()
            : new Date(session.date).toISOString(),
        scheduledTime: formatScheduledTime(reservationStartHour),
        actualStartTime: session.actualStartTime
          ? session.actualStartTime instanceof Date
            ? session.actualStartTime.toISOString()
            : new Date(session.actualStartTime).toISOString()
          : null,
        actualEndTime: session.actualEndTime
          ? session.actualEndTime instanceof Date
            ? session.actualEndTime.toISOString()
            : new Date(session.actualEndTime).toISOString()
          : null,
        status: resolveBookingStatus(
          session.status,
          session.reservation?.startTime || session.date,
        ),
      };
    }) || [];

  const improvementRecords = buildImprovementRecords(plan.sessions);

  return {
    id: plan.id,
    treatmentPlanId: plan.id,
    mode: latestSession?.mode || plan.therapist?.mode || 'home_visit',
    overallStatus,
    status: overallStatus,
    therapist: {
      id: plan.therapist?.id || '',
      therapistId: plan.therapist?.therapistId || plan.therapist?.id || '',
      name: plan.therapist?.user?.name || 'Therapist',
      image: plan.therapist?.user?.image || '',
      gender: (plan.therapist?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      rating: plan.therapist?.rating || 4.8,
    },
    patient: {
      id: plan.patient?.id || fallbackPatient?.id || plan.patientId,
      name: patientDetail?.name || 'Patient',
      dob: patientDetail?.dob
        ? patientDetail.dob instanceof Date
          ? patientDetail.dob.toISOString()
          : new Date(patientDetail.dob).toISOString()
        : null,
      gender: (patientDetail?.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      phone: patientDetail?.phone || '',
    },
    condition: {
      title: latestSession?.condition || 'Physical Therapy Session',
    },
    problemDescription: latestSession?.DescribedAs || '',
    location: {
      address: patientLocation?.address || plan.therapist?.displayAddress || '',
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
      plan.docRecords?.map((document) => {
        const dateObj =
          document.createdAt instanceof Date ? document.createdAt : new Date(document.createdAt);
        return {
          id: document.id,
          title: document.name,
          name: document.name,
          type: document.fileType || 'Document',
          fileType: document.fileType,
          url: document.url,
          date: dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          createdAt: dateObj.toISOString(),
        };
      }) || [],
    clinicalAssessments: plan.clinicalAssessments || [],
    improvementRecords,
  };
};
