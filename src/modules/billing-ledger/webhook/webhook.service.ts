import prisma from '@/config/prisma';
import { bookingSessionService } from '@/modules/treatment-lifecycle/reservation/reservation-session/reservationSession.service';
import { logger } from '@/core/logger/logger';
import razorpayService from '@/shared/external/razorpay.service';
import { ValidationError } from '@/core/errors/ApiError';
import { RAZORPAY_WEBHOOK_SECRET } from '@/core/constants';

export interface RazorpayWebhookPayload {
  event?: string;
  event_id?: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  paymentId?: string;
  sessionId?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
      };
    };
  };
}

class WebhookService {
  async handlePaymentWebhook(body: RazorpayWebhookPayload, rawBody?: Buffer, signature?: string) {
    logger.info('Received Payment Webhook request', {
      event: body?.event,
      hasSignature: !!signature,
    });

    // 1. Verify Webhook Signature if secret is configured and signature header is present
    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const payloadToVerify = rawBody || JSON.stringify(body);
      const isValid = razorpayService.verifyWebhookSignature(payloadToVerify, signature);

      if (!isValid) {
        logger.warn('Razorpay Webhook signature verification failed');
        throw new ValidationError('Invalid Razorpay webhook signature');
      }
    }

    const event = body?.event;
    const eventId = body?.event_id;

    // Check Idempotency via webhookEventId
    if (eventId) {
      const existingPayment = await prisma.payment.findFirst({
        where: { webhookEventId: eventId },
      });
      if (existingPayment) {
        logger.info('Webhook event already processed (idempotent skip)', { eventId });
        return { message: 'Webhook event already processed' };
      }
    }

    const paymentEntity = body?.payload?.payment?.entity;
    const refundEntity = body?.payload?.refund?.entity;

    const gatewayPaymentId = paymentEntity?.id || body?.gatewayPaymentId || body?.paymentId;
    const gatewayOrderId = paymentEntity?.order_id || body?.gatewayOrderId;
    const notes = paymentEntity?.notes || {};
    const sessionId = notes.sessionId || body?.sessionId;
    const internalPaymentId = notes.paymentId || body?.paymentId;

    // 2. Handle Razorpay Specific Events
    if (event === 'payment.captured' || event === 'payment.authorized') {
      logger.info(`Processing ${event}`, { gatewayOrderId, gatewayPaymentId, sessionId });

      // Finalize booking if booking session ID exists
      let reservationResult = null;
      if (sessionId) {
        try {
          reservationResult = await bookingSessionService.finalizeBooking(
            sessionId,
            gatewayPaymentId,
          );
        } catch (err) {
          logger.warn('Error finalizing booking from webhook', { err, sessionId });
        }
      }

      // Update internal Payment record
      const paymentFilter = internalPaymentId
        ? { id: internalPaymentId }
        : gatewayOrderId
          ? { gatewayOrderId }
          : gatewayPaymentId
            ? { gatewayPaymentId }
            : null;

      if (paymentFilter) {
        await prisma.payment.updateMany({
          where: paymentFilter,
          data: {
            status: 'completed',
            paidAt: new Date(),
            gatewayPaymentId: gatewayPaymentId || null,
            ...(eventId ? { webhookEventId: eventId } : {}),
          },
        });
      }

      return {
        message: 'Payment captured and processed successfully',
        reservation: reservationResult,
      };
    }

    if (event === 'payment.failed') {
      logger.info('Processing payment.failed webhook', { gatewayOrderId, gatewayPaymentId });

      const paymentFilter = internalPaymentId
        ? { id: internalPaymentId }
        : gatewayOrderId
          ? { gatewayOrderId }
          : null;

      if (paymentFilter) {
        await prisma.payment.updateMany({
          where: paymentFilter,
          data: {
            status: 'failed',
            failedAt: new Date(),
            ...(eventId ? { webhookEventId: eventId } : {}),
          },
        });
      }

      return { message: 'Payment marked as failed' };
    }

    if (event === 'refund.created' || event === 'refund.processed') {
      logger.info(`Processing ${event} webhook`, { refundEntity });

      const rzpPaymentId = refundEntity?.payment_id || gatewayPaymentId;
      if (rzpPaymentId) {
        await prisma.payment.updateMany({
          where: { gatewayPaymentId: rzpPaymentId },
          data: {
            status: 'refunded',
            refundedAt: new Date(),
            ...(eventId ? { webhookEventId: eventId } : {}),
          },
        });
      }

      return { message: 'Refund event recorded' };
    }

    // 3. Fallback / Generic webhook payload handling
    if (sessionId) {
      const result = await bookingSessionService.finalizeBooking(sessionId, gatewayPaymentId);
      return result;
    }

    if (internalPaymentId) {
      await prisma.payment.update({
        where: { id: internalPaymentId },
        data: {
          status: 'completed',
          paidAt: new Date(),
          gatewayPaymentId: gatewayPaymentId || null,
          ...(eventId ? { webhookEventId: eventId } : {}),
        },
      });
      return { message: 'Payment updated successfully' };
    }

    return { message: 'Webhook received' };
  }
}

export default new WebhookService();
