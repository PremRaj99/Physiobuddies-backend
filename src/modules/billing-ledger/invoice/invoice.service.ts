import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
class InvoiceService {
  getInvoiceById = async (invoiceId: string) => {
    const payment = await prisma.payment.findUnique({
      where: { invoiceId },
      include: {
        bills: true,
        subscription: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Invoice not found');
    }
    return payment;
  };
}

export default new InvoiceService();
