import prisma from '@/config/prisma';
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

    if (!session) throw new NotFoundError('Treatment session not found');

    const treatmentPlanId = session.treatmentPlanId;
    const mapped = mapClinicalAssessmentPayload(
      assessmentData as AssessmentInputPayload,
      treatmentPlanId,
    );

    // Always create a new Assessment record (no update/overwrite)
    await prisma.clinicalAssessment.create({
      data: mapped,
    });

    // Complete session 1 if it is currently active or confirmed
    if (session.status === 'active' || session.status === 'confirmed') {
      await prisma.treatmentSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          actualEndTime: new Date(),
        },
      });

      await prisma.treatmentSessionStatusLog.create({
        data: {
          sessionId: session.id,
          fromStatus: session.status,
          toStatus: 'completed',
          changedBy: 'therapist',
          reason: 'Clinical Assessment completed for 1st session',
        },
      });
    }
  }
}

export default new TreatmentSessionAssessmentService();
