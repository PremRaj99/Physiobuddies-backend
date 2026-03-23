import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
class AdminService {
  async getDashboardData() {
    // Logic to get dashboard data
    return {};
  }

  async getAllPayments() {
    // Logic to get all payments
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return payments;
  }

  async getAllCommissions() {
    const commissions = await prisma.commission.findMany();
    return commissions;
  }

  async getAllPayouts() {
    const payouts = await prisma.payout.findMany();
    return payouts;
  }

  async processPayout(payoutRequestId: string) {
    // Logic to process payout
    const payout = await prisma.payout.findUnique({
      where: { id: payoutRequestId },
    });

    if (!payout) {
      throw new NotFoundError('Payout request not found');
    }

    await prisma.payout.update({
      where: { id: payoutRequestId },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });

    return;
  }

  async processRefund(sessionId: string) {
    // Logic to process refund
    if (!sessionId) {
      throw new NotFoundError('Session ID is required for refund');
    }
    // Implement refund logic here, e.g., interact with payment gateway to process the refund
    return;
  }
}

export const adminService = new AdminService();
