import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { resolveTherapist } from '../wallet/wallet.helper';

class TherapistEarningService {
  getEarnings = async (userId: string) => {
    const therapist = await resolveTherapist(userId);

    return prisma.commission.findMany({
      where: { therapistId: therapist.id },
      orderBy: { sessionDate: 'desc' },
    });
  };

  getEarningsSummary = async (userId: string) => {
    const therapist = await resolveTherapist(userId);

    const [agg, count] = await Promise.all([
      prisma.commission.aggregate({
        where: { therapistId: therapist.id },
        _sum: { therapistAmount: true, platformFee: true, sessionAmount: true },
      }),
      prisma.commission.count({ where: { therapistId: therapist.id } }),
    ]);

    return {
      totalEarned: agg._sum.therapistAmount ?? 0,
      totalPlatformFee: agg._sum.platformFee ?? 0,
      totalGross: agg._sum.sessionAmount ?? 0,
      count,
    };
  };

  getEarningsBySession = async (userId: string, sessionId: string) => {
    const therapist = await resolveTherapist(userId);

    const bill = await prisma.treatmentSessionBill.findUnique({
      where: { sessionId },
      include: { commission: true },
    });

    if (!bill || !bill.commission || bill.commission.therapistId !== therapist.id) {
      throw new NotFoundError('Earning record not found for this session');
    }

    return { ...bill.commission, bill: { ...bill, commission: undefined } };
  };
}

export default new TherapistEarningService();
