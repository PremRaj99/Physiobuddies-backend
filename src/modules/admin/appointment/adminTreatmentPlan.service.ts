import prisma from '@/config/prisma';
class AdminTreatmentPlanService {
  getAllTreatmentPlans = async () => {
    const treatmentPlans = await prisma.treatmentPlan.findMany({
      include: {
        sessions: {
          include: {
            reservation: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return treatmentPlans.map((treatmentPlan) => ({
      id: treatmentPlan.id,
      location: treatmentPlan.locationSnapshot,
      email: treatmentPlan.patientDetailsSnapshot,
      status: treatmentPlan.status,
      sessions: treatmentPlan.sessions.map((session) => ({
        id: session.id,
        date: session.reservation?.date,
        startTime: session.reservation?.startTime,
        endTime: session.reservation?.endTime,
      })),
    }));
  };
  getTreatmentPlanById = async (treatmentPlanId: string) => {
    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: {
        sessions: {
          include: {
            reservation: true,
          },
        },
      },
    });

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found');
    }

    return treatmentPlan;
  };
}

export default new AdminTreatmentPlanService();
