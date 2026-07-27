import prisma from '@/config/prisma';
import { bookingSessionService } from '@/modules/treatment-lifecycle/reservation/reservation-session/reservationSession.service';
import { logger } from '@/core/logger/logger';

class WebhookService {
  async handlePaymentWebhook(payload: {
    event?: string;
    sessionId?: string;
    paymentId?: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
  }) {
    logger.info('Received Payment Webhook:', payload);

    const { sessionId, paymentId, gatewayPaymentId } = payload;

    if (sessionId) {
      return bookingSessionService.finalizeBooking(sessionId, gatewayPaymentId);
    }

    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          paidAt: new Date(),
          gatewayPaymentId: gatewayPaymentId || null,
        },
      });
      return { message: 'Payment updated successfully' };
    }

    return { message: 'Webhook received' };
  }
}

export default new WebhookService();
