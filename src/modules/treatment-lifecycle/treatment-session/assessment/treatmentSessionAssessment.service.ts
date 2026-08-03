import prisma from '@/config/prisma';
import { StatusChangeActor, TreatmentPlanStatus, SessionStatus } from '@prisma/client';
import { NotFoundError } from '@/core/errors/ApiError';
import {
  mapClinicalAssessmentPayload,
  type AssessmentInputPayload,
} from '@/modules/treatment-lifecycle/treatment/treatment-plan/assessment.helper';

class TreatmentSessionAssessmentService {
  async getAssessment(sessionId: string) {
    let session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: {
        treatmentPlan: { include: { clinicalAssessments: { orderBy: { createdAt: 'desc' } } } },
      },
    });
    if (!session) {
      session = await prisma.treatmentSession.findFirst({
        where: { reservationId: sessionId },
        include: {
          treatmentPlan: { include: { clinicalAssessments: { orderBy: { createdAt: 'desc' } } } },
        },
      });
    }

    if (!session) throw new NotFoundError('Treatment session not found');

    return session.treatmentPlan.clinicalAssessments || [];
  }

  async createOrUpdateAssessment(sessionId: string, assessmentData: unknown) {
    let session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true },
    });
    if (!session) {
      session = await prisma.treatmentSession.findFirst({
        where: { reservationId: sessionId },
        include: { treatmentPlan: true },
      });
    }

    if (!session) {
      const reservation = await prisma.slotReservation.findUnique({
        where: { id: sessionId },
        include: { treatmentSession: { include: { treatmentPlan: true } } },
      });

      if (reservation) {
        if (reservation.treatmentSession) {
          session = reservation.treatmentSession;
        } else {
          // Find or create TreatmentPlan for this patient and therapist
          const whereClause: { therapistId: string; patientId?: string } = {
            therapistId: reservation.therapistId,
          };
          if (reservation.patientId) {
            whereClause.patientId = reservation.patientId;
          }

          let plan = await prisma.treatmentPlan.findFirst({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
          });

          if (!plan && reservation.patientId) {
            plan = await prisma.treatmentPlan.create({
              data: {
                patientId: reservation.patientId,
                therapistId: reservation.therapistId,
                locationId: '600000000000000000000000',
                patientDetailId: '600000000000000000000000',
                status: TreatmentPlanStatus.created,
                patientDetailsSnapshot: {},
                locationSnapshot: {},
                therapistSnapshot: {},
              },
            });
          }

          if (plan) {
            const therapist = await prisma.therapist.findUnique({
              where: { id: reservation.therapistId },
            });
            const patient = reservation.patientId
              ? await prisma.patient.findUnique({
                  where: { id: reservation.patientId },
                })
              : null;

            session = await prisma.treatmentSession.create({
              data: {
                treatmentPlanId: plan.id,
                reservationId: reservation.id,
                date: reservation.date,
                status: SessionStatus.confirmed,
                mode: 'home_visit',
                condition: 'General',
                priceAtBooking: 0,
                therapistSnapshot: therapist ? JSON.parse(JSON.stringify(therapist)) : {},
                patientDetailSnapshot: patient ? JSON.parse(JSON.stringify(patient)) : {},
              },
              include: { treatmentPlan: true },
            });
          }
        }
      }
    }

    if (!session) throw new NotFoundError('Treatment session not found');

    const assessmentPayload = assessmentData as AssessmentInputPayload;
    const treatmentPlanId = session.treatmentPlanId;
    const mapped = mapClinicalAssessmentPayload(assessmentPayload, treatmentPlanId);

    // Drop stale MongoDB unique index on treatmentPlanId if present to allow multiple assessment reports (initial + follow-ups)
    try {
      await prisma.$runCommandRaw({
        dropIndexes: 'ClinicalAssessment',
        index: 'ClinicalAssessment_treatmentPlanId_key',
      });
    } catch {
      // Ignore if index is already dropped or does not exist
    }

    // Always create a new Assessment record for the treatment plan
    await prisma.clinicalAssessment.create({
      data: mapped,
    });

    // Complete session 1 if it is currently active or confirmed
    if (session.status === SessionStatus.active || session.status === SessionStatus.confirmed) {
      await prisma.treatmentSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.completed,
          actualEndTime: new Date(),
        },
      });

      await prisma.treatmentSessionStatusLog.create({
        data: {
          sessionId: session.id,
          fromStatus: session.status,
          toStatus: SessionStatus.completed,
          changedBy: StatusChangeActor.therapist,
          reason: 'Clinical Assessment completed for 1st session',
        },
      });
    }
  }
}

export default new TreatmentSessionAssessmentService();
