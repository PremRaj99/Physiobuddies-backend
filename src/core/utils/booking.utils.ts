export const formatScheduledTime = (startHourNum: number, durationMinutes: number = 40): string => {
  const startAmPm = startHourNum >= 12 ? 'PM' : 'AM';
  const formattedStartHour = startHourNum % 12 || 12;

  const totalEndMinutes = startHourNum * 60 + durationMinutes;
  const endHour24 = Math.floor(totalEndMinutes / 60) % 24;
  const endMinutes = totalEndMinutes % 60;
  const endAmPm = endHour24 >= 12 ? 'PM' : 'AM';
  const formattedEndHour = endHour24 % 12 || 12;

  const startStr = `${String(formattedStartHour).padStart(2, '0')}:00 ${startAmPm}`;
  const endStr = `${String(formattedEndHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')} ${endAmPm}`;

  return `${startStr} - ${endStr}`;
};

export const formatDateStr = (
  date: Date | string,
  monthFormat: 'long' | 'short' = 'long',
): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: monthFormat,
    day: '2-digit',
    year: 'numeric',
  });
};

export const resolveBookingStatus = (
  rawStatus: string,
  startTime: Date | string,
  sessionStatus?: string | null,
): string => {
  let statusFormatted = rawStatus.toUpperCase();
  if (sessionStatus) {
    statusFormatted = sessionStatus.toUpperCase();
  } else if (statusFormatted === 'BOOKED') {
    const isPast = new Date(startTime) < new Date();
    statusFormatted = isPast ? 'COMPLETED' : 'UPCOMING';
  }
  return statusFormatted;
};

export const TREATMENT_PLAN_INCLUDE = {
  include: {
    clinicalAssessments: {
      orderBy: { createdAt: 'desc' as const },
    },
    docRecords: true,
    sessions: {
      include: {
        reservation: true,
        improvementRecord: true,
      },
      orderBy: { date: 'asc' as const },
    },
  },
};

export const TREATMENT_SESSION_WITH_PLAN_INCLUDE = {
  include: {
    treatmentPlan: TREATMENT_PLAN_INCLUDE,
  },
};

export interface SessionWithImprovement {
  date: Date | string;
  improvementRecord?: unknown | null;
}

export const buildImprovementRecords = (sessions?: Array<SessionWithImprovement | null>) => {
  return (sessions || [])
    .map((s) => (s?.improvementRecord ? { ...s.improvementRecord, sessionDate: s.date } : null))
    .filter(Boolean);
};
