import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { generateInvoiceId } from './generateInvoiceId';
class PaymentService {
  createPaymentOrder = async ({
    amount,
    userId,
    purpose,
  }: {
    amount: number;
    currency: string;
    userId: string;
    purpose: 'therapy_session' | 'subscription';
  }) => {
    const payment = await prisma.payment.create({
      data: {
        amount,
        userId,
        invoiceId: generateInvoiceId(),
        purpose,
        status: 'pending',
      },
    });
    return payment;
  };

  verifyPayment = async ({
    paymentId,
    orderId,
    signature,
  }: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
    if (!paymentId || !orderId || !signature) {
      throw new NotFoundError('Invalid payment details');
    }
    // Logic to verify payment with the payment gateway
    // This is a placeholder implementation and should be replaced with actual verification logic
    return true; // Assume payment is verified successfully for this example
  };

  getPayments = async (userId: string) => {
    const payments = await prisma.payment.findMany({
      where: {
        userId,
      },
    });
    return payments;
  };

  getPaymentById = async (id: string, userId: string) => {
    const payment = await prisma.payment.findUnique({
      where: {
        id,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  };
}

export const paymentService = new PaymentService();
