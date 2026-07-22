import prisma from '@/config/prisma';
import { resolveTherapist, computeBalance } from './wallet.helper';

class TherapistWalletService {
  async getWalletInfo(userId: string) {
    const therapist = await resolveTherapist(userId);

    const entries = await prisma.therapistWallet.findMany({
      where: { therapistId: therapist.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      balance: computeBalance(entries),
      entries,
    };
  }
}

export default new TherapistWalletService();
