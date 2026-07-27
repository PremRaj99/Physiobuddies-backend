import prisma from '@/config/prisma';
import { SessionStatus, StatusChangeActor, TreatmentPlanStatus } from '@prisma/client';
import {
  VALID_SESSION_TRANSITIONS,
  VALID_PLAN_TRANSITIONS,
} from '@/modules/treatment-lifecycle/statusLog.service';
import { logger } from '@/core/logger/logger';

// ─────────────────────────────────────────────────────
// NO-SHOW AUTO-TRIGGER
// Runs every 15 minutes. Marks sessions as no-show if:
//   - Session is 'confirmed' and scheduled start time + 1 hour has passed
//   - Session is 'active' and scheduled start time + 1 hour (after session end) has passed
// ─────────────────────────────────────────────────────
async function processAutoNoShow() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Find confirmed sessions whose slot start + 1hr has passed (therapist never showed up)
    const staleSessions = await prisma.treatmentSession.findMany({
      where: {
        status: { in: ['confirmed', 'active'] },
        reservation: {
          startTime: { lt: oneHourAgo },
        },
      },
      include: { reservation: true },
    });

    for (const session of staleSessions) {
      try {
        // Double-check the transition is valid
        const allowed = VALID_SESSION_TRANSITIONS[session.status] || [];
        if (!allowed.includes(SessionStatus.no_show)) continue;

        await prisma.$transaction(async (tx) => {
          await tx.treatmentSession.update({
            where: { id: session.id },
            data: { status: SessionStatus.no_show },
          });

          await tx.treatmentSessionStatusLog.create({
            data: {
              sessionId: session.id,
              fromStatus: session.status as SessionStatus,
              toStatus: SessionStatus.no_show,
              changedBy: StatusChangeActor.system,
              reason: 'Auto no-show: session time + 1 hour elapsed without completion',
            },
          });
        });

        logger.info(`[Scheduler] Auto no-show applied to session ${session.id}`);
      } catch (err) {
        logger.error(`[Scheduler] Failed to mark session ${session.id} as no-show:`, err);
      }
    }
  } catch (err) {
    logger.error('[Scheduler] Auto no-show job failed:', err);
  }
}

// ─────────────────────────────────────────────────────
// TREATMENT PLAN AUTO-COMPLETE
// Runs daily. If ALL sessions in a treatment plan have been no-show
// for the past 7 days and no upcoming sessions, mark the plan as abandoned.
// ─────────────────────────────────────────────────────
async function processAutoCompletePlans() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Find ongoing plans that haven't had any active/completed sessions recently
    const stalePlans = await prisma.treatmentPlan.findMany({
      where: {
        status: 'ongoing',
      },
      include: {
        sessions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    for (const plan of stalePlans) {
      try {
        // Check if all sessions are no_show within the last 7 days
        const recentSessions = plan.sessions.filter((s) => new Date(s.date) >= sevenDaysAgo);

        const hasUpcoming = plan.sessions.some(
          (s) => new Date(s.date) > now && !['cancelled', 'no_show', 'expired'].includes(s.status),
        );

        if (hasUpcoming) continue;

        // Check if all recent sessions are no-show
        const allNoShow =
          recentSessions.length > 0 && recentSessions.every((s) => s.status === 'no_show');

        // Also abandon if no sessions at all in last 7 days and plan has sessions before that
        const noRecentActivity = recentSessions.length === 0 && plan.sessions.length > 0;

        if (allNoShow || noRecentActivity) {
          const allowed = VALID_PLAN_TRANSITIONS[plan.status] || [];
          if (!allowed.includes(TreatmentPlanStatus.abandoned)) continue;

          await prisma.$transaction(async (tx) => {
            await tx.treatmentPlan.update({
              where: { id: plan.id },
              data: { status: TreatmentPlanStatus.abandoned },
            });

            await tx.treatmentPlanStatusLog.create({
              data: {
                treatmentPlanId: plan.id,
                fromStatus: plan.status as TreatmentPlanStatus,
                toStatus: TreatmentPlanStatus.abandoned,
                changedBy: StatusChangeActor.system,
                reason: allNoShow
                  ? 'Auto abandoned: all sessions in last 7 days were no-show'
                  : 'Auto abandoned: no session activity for 7+ days',
              },
            });
          });

          logger.info(`[Scheduler] Auto-abandoned treatment plan ${plan.id}`);
        }
      } catch (err) {
        logger.error(`[Scheduler] Failed to process plan ${plan.id}:`, err);
      }
    }
  } catch (err) {
    logger.error('[Scheduler] Auto-complete plans job failed:', err);
  }
}

// ─────────────────────────────────────────────────────
// SCHEDULER SETUP
// Uses setInterval since node-cron is not in dependencies.
// ─────────────────────────────────────────────────────
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

let noShowIntervalId: ReturnType<typeof setInterval> | null = null;
let planCompleteIntervalId: ReturnType<typeof setInterval> | null = null;

export function startSessionSchedulers() {
  logger.info('[Scheduler] Starting session schedulers...');

  // Auto no-show: every 15 minutes
  noShowIntervalId = setInterval(processAutoNoShow, FIFTEEN_MINUTES_MS);
  logger.info('[Scheduler] Auto no-show job scheduled (every 15 minutes)');

  // Auto plan complete/abandon: every 1 hour
  planCompleteIntervalId = setInterval(processAutoCompletePlans, ONE_HOUR_MS);
  logger.info('[Scheduler] Auto plan-complete job scheduled (every 1 hour)');

  // Run once immediately on startup
  processAutoNoShow();
  processAutoCompletePlans();
}

export function stopSessionSchedulers() {
  if (noShowIntervalId) {
    clearInterval(noShowIntervalId);
    noShowIntervalId = null;
  }
  if (planCompleteIntervalId) {
    clearInterval(planCompleteIntervalId);
    planCompleteIntervalId = null;
  }
  logger.info('[Scheduler] Session schedulers stopped.');
}
