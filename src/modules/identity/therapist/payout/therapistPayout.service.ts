import prisma from '@/config/prisma';
import { NotFoundError, ValidationError } from '@/core/errors/ApiError';
import { computeBalance, resolveTherapist } from '../wallet/wallet.helper';

class TherapistPayoutService {
  async requestPayout(userId: string, amount: number) {
    const therapist = await resolveTherapist(userId);

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const entries = await prisma.therapistWallet.findMany({
      where: { therapistId: therapist.id },
    });
    const balance = computeBalance(entries);

    if (amount > balance) {
      throw new ValidationError('Insufficient balance');
    }

    const account = await prisma.accountDetail.findFirst({
      where: { therapistId: therapist.id, isDefault: true, deletedAt: { isSet: false } },
    });

    if (!account) {
      throw new ValidationError('No payout account on file');
    }

    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          therapistId: therapist.id,
          amount,
          status: 'requested',
          accountSnapshotJson: {
            accountHolderName: account.accountHolderName,
            bankName: account.bankName,
            branchName: account.branchName,
            accountNumber: account.accountNumber,
            ifsc: account.ifsc,
            upi: account.upi,
            payoutMethod: account.payoutMethod,
          },
        },
      });

      await tx.therapistWallet.create({
        data: {
          therapistId: therapist.id,
          amount: -amount,
          type: 'hold',
          referenceId: payout.id,
          balanceAfter: balance - amount,
        },
      });

      return payout;
    });
  }

  async getPayouts(userId: string) {
    const therapist = await resolveTherapist(userId);

    return prisma.payout.findMany({
      where: { therapistId: therapist.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayoutById(payoutId: string, userId: string) {
    const therapist = await resolveTherapist(userId);

    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout || payout.therapistId !== therapist.id) {
      throw new NotFoundError('Payout not found');
    }

    return payout;
  }
}

export default new TherapistPayoutService();
