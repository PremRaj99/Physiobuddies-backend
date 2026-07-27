import prisma from '@/config/prisma';
import { SessionStatus, TreatmentPlanStatus, StatusChangeActor } from '@prisma/client';
import { ValidationError } from '@/core/errors/ApiError';

export const VALID_SESSION_TRANSITIONS: Record<string, SessionStatus[]> = {
  // initial creation
  __initial__: [SessionStatus.pending],
  [SessionStatus.pending]: [
    SessionStatus.confirmed,
    SessionStatus.expired,
    SessionStatus.cancelled,
  ],
  [SessionStatus.confirmed]: [SessionStatus.active, SessionStatus.cancelled, SessionStatus.no_show],
  [SessionStatus.active]: [SessionStatus.completed, SessionStatus.no_show],
  [SessionStatus.completed]: [SessionStatus.settled],
  // Terminal states
  [SessionStatus.settled]: [],
  [SessionStatus.cancelled]: [],
  [SessionStatus.no_show]: [],
  [SessionStatus.expired]: [],
};

export const VALID_PLAN_TRANSITIONS: Record<string, TreatmentPlanStatus[]> = {
  // initial creation
  __initial__: [TreatmentPlanStatus.created],
  [TreatmentPlanStatus.created]: [
    TreatmentPlanStatus.treatment_planned,
    TreatmentPlanStatus.cancelled,
  ],
  [TreatmentPlanStatus.treatment_planned]: [
    TreatmentPlanStatus.ongoing,
    TreatmentPlanStatus.cancelled,
  ],
  [TreatmentPlanStatus.ongoing]: [
    TreatmentPlanStatus.completed,
    TreatmentPlanStatus.cancelled,
    TreatmentPlanStatus.abandoned,
  ],
  // Terminal states
  [TreatmentPlanStatus.completed]: [],
  [TreatmentPlanStatus.cancelled]: [],
  [TreatmentPlanStatus.abandoned]: [],
};

class StatusLogService {
  validateSessionTransition(fromStatus: SessionStatus | null, toStatus: SessionStatus) {
    const key = fromStatus ? fromStatus : '__initial__';
    const allowed = VALID_SESSION_TRANSITIONS[key] || [];
    if (!allowed.includes(toStatus)) {
      throw new ValidationError(
        `Invalid SessionStatus transition from '${fromStatus || 'none'}' to '${toStatus}'`,
      );
    }
  }

  validatePlanTransition(fromStatus: TreatmentPlanStatus | null, toStatus: TreatmentPlanStatus) {
    const key = fromStatus ? fromStatus : '__initial__';
    const allowed = VALID_PLAN_TRANSITIONS[key] || [];
    if (!allowed.includes(toStatus)) {
      throw new ValidationError(
        `Invalid TreatmentPlanStatus transition from '${fromStatus || 'none'}' to '${toStatus}'`,
      );
    }
  }

  async logSessionStatusChange(data: {
    sessionId: string;
    fromStatus: SessionStatus | null;
    toStatus: SessionStatus;
    changedBy: StatusChangeActor;
    changedByUserId?: string | null;
    reason?: string | null;
  }) {
    this.validateSessionTransition(data.fromStatus, data.toStatus);

    return prisma.treatmentSessionStatusLog.create({
      data: {
        sessionId: data.sessionId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        changedBy: data.changedBy,
        changedByUserId: data.changedByUserId ?? null,
        reason: data.reason ?? null,
      },
    });
  }

  async logPlanStatusChange(data: {
    treatmentPlanId: string;
    fromStatus: TreatmentPlanStatus | null;
    toStatus: TreatmentPlanStatus;
    changedBy: StatusChangeActor;
    changedByUserId?: string | null;
    reason?: string | null;
  }) {
    this.validatePlanTransition(data.fromStatus, data.toStatus);

    return prisma.treatmentPlanStatusLog.create({
      data: {
        treatmentPlanId: data.treatmentPlanId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        changedBy: data.changedBy,
        changedByUserId: data.changedByUserId ?? null,
        reason: data.reason ?? null,
      },
    });
  }

  async getSessionStatusHistory(sessionId: string) {
    return prisma.treatmentSessionStatusLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPlanStatusHistory(treatmentPlanId: string) {
    return prisma.treatmentPlanStatusLog.findMany({
      where: { treatmentPlanId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const statusLogService = new StatusLogService();
