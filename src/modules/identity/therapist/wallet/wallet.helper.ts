import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';

/**
 * Resolve the Therapist record from the authenticated User id.
 * `req.user.id` is a User id, but wallet/commission/payout models key on Therapist.id.
 */
export const resolveTherapist = async (userId: string) => {
  const therapist = await prisma.therapist.findUnique({ where: { userId } });
  if (!therapist) throw new NotFoundError('Therapist profile not found');
  return therapist;
};

/**
 * Available balance = signed sum of wallet ledger amounts.
 * earning is positive; payout/penalty/hold are stored as negative; adjust can be ±.
 */
export const computeBalance = (entries: { amount: number }[]) =>
  entries.reduce((acc, e) => acc + e.amount, 0);
