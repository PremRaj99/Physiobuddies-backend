import prisma from '@/config/prisma';
import { ValidationError, NotFoundError } from '@/core/errors/ApiError';
import { redisClient } from '@/shared/redis';
import {
  BOOKING_SESSION_PREFIX,
  FORM_HOLD_MINUTES,
  PAYMENT_HOLD_MINUTES,
  getSlotHoldKey,
} from '@/core/constants/slots';
import { SlotManager } from './slotManagement';
import { generateInvoiceId } from '@/modules/billing-ledger/payment/generateInvoiceId';
import { BookingSessionData, UpdateBookingFormDTO } from './reservationSession.type';
import razorpayService from '@/shared/external/razorpay.service';
import { logger } from '@/core/logger/logger';
import { RAZORPAY_API_KEY } from '@/core/constants';
import {
  handleExpiredSessionRefund,
  executeFinalizeBookingTransaction,
  applyCouponDiscount,
} from './reservationSession.helper';

class BookingSessionService {
  /**
   * Step 1: Create a secure booking session in Redis (10 minutes initial form hold)
   */
  async createBookingSession(data: {
    patientId: string;
    therapistId: string;
    date: Date;
    startHour: number;
  }) {
    const { patientId, therapistId, date, startHour } = data;

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const holdResult = await SlotManager.holdSlot(therapistId, patientId, dateOnly, startHour);
    const reservationId = holdResult.reservationId;

    const now = new Date();
    const expiresAt = holdResult.expiresAt;

    const sessionData: BookingSessionData = {
      sessionId: reservationId,
      reservationId,
      therapistId,
      patientId,
      date: dateOnly.toISOString(),
      startHour,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      step: 1,
      formData: {
        patientDetailId: null,
        locationId: null,
        conditionId: null,
        problemDesc: '',
        couponCode: null,
        couponDiscount: 0,
      },
      paymentPhase: false,
      paymentId: null,
    };

    const sessionKey = `${BOOKING_SESSION_PREFIX}${reservationId}`;
    const ttlSeconds = FORM_HOLD_MINUTES * 60;

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    return {
      sessionId: reservationId,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt,
    };
  }

  /**
   * Get booking session state from Redis
   */
  async getBookingSession(sessionId: string, patientId: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) {
      const existing = await prisma.slotReservation.findUnique({
        where: { id: sessionId },
      });
      if (existing && existing.status === 'booked') {
        return { isConfirmed: true, reservationId: sessionId };
      }
      throw new NotFoundError('Booking session not found or has expired.');
    }

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    if (sessionData.patientId !== patientId) {
      throw new ValidationError('You can only access your own booking session.');
    }

    const now = new Date();
    if (new Date(sessionData.expiresAt) < now) {
      await redisClient.del(sessionKey);
      throw new ValidationError('Booking session expired.');
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: sessionData.therapistId },
      include: { user: { select: { name: true, image: true } } },
    });

    return {
      ...sessionData,
      therapist: therapist
        ? {
            id: therapist.id,
            name: therapist.user.name,
            image: therapist.user.image,
            price: therapist.price,
            priceAlt: therapist.priceAlt,
            mode: therapist.mode,
            clinic: therapist.clinic,
            address: therapist.displayAddress,
          }
        : null,
    };
  }

  /**
   * Update form progress step-by-step
   */
  async updateBookingSessionForm(
    sessionId: string,
    patientId: string,
    formData: UpdateBookingFormDTO,
  ) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) {
      throw new NotFoundError('Booking session expired or not found.');
    }

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    if (sessionData.patientId !== patientId) {
      throw new ValidationError('Unauthorized session update.');
    }

    if (formData.step !== undefined) sessionData.step = formData.step;
    if (formData.patientDetailId !== undefined)
      sessionData.formData.patientDetailId = formData.patientDetailId;
    if (formData.locationId !== undefined) sessionData.formData.locationId = formData.locationId;
    if (formData.conditionId !== undefined) sessionData.formData.conditionId = formData.conditionId;
    if (formData.problemDesc !== undefined) sessionData.formData.problemDesc = formData.problemDesc;

    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    return sessionData;
  }

  /**
   * Apply coupon code to booking session
   */
  async applyCoupon(sessionId: string, patientId: string, couponCode: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) throw new NotFoundError('Booking session expired or not found.');

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    if (sessionData.patientId !== patientId) throw new ValidationError('Unauthorized access.');

    const result = await applyCouponDiscount(sessionData, couponCode);

    sessionData.formData.couponCode = result.couponCode;
    sessionData.formData.couponDiscount = result.discountAmount;

    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    return {
      message: 'Coupon applied successfully!',
      couponCode: result.couponCode,
      discount: result.discountAmount,
      originalPrice: result.originalPrice,
      finalPrice: result.finalPrice,
    };
  }

  /**
   * Remove coupon from booking session
   */
  async removeCoupon(sessionId: string, patientId: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) throw new NotFoundError('Booking session expired or not found.');

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    if (sessionData.patientId !== patientId) throw new ValidationError('Unauthorized access.');

    sessionData.formData.couponCode = null;
    sessionData.formData.couponDiscount = 0;

    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    return { message: 'Coupon removed successfully' };
  }

  /**
   * Initiate payment step - extends Redis TTL by 10 mins for payment completion
   */
  async initiatePayment(sessionId: string, patientUserId: string) {
    try {
      logger.info('[initiatePayment] Request received', { sessionId, patientUserId });

      const patient = await prisma.patient.findUnique({ where: { userId: patientUserId } });
      if (!patient) throw new NotFoundError('Patient not found.');

      const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
      const rawData = await redisClient.get(sessionKey);

      if (!rawData) throw new NotFoundError('Booking session expired or not found.');

      const sessionData = JSON.parse(rawData) as BookingSessionData;

      const therapist = await prisma.therapist.findUnique({
        where: { id: sessionData.therapistId },
      });
      if (!therapist) throw new NotFoundError('Therapist not found.');

      const finalAmount = Math.max(0, therapist.price - (sessionData.formData.couponDiscount || 0));
      const invoiceId = generateInvoiceId();

      let razorpayOrder = null;
      try {
        razorpayOrder = await razorpayService.createOrder({
          amount: finalAmount,
          currency: 'INR',
          receipt: invoiceId,
          notes: {
            sessionId,
            patientUserId,
            therapistId: sessionData.therapistId,
          },
        });
      } catch (err) {
        logger.warn('[initiatePayment] Razorpay order creation failed, using dev fallback', {
          err,
        });
        razorpayOrder = { id: `order_fake_${Date.now()}` };
      }

      const payment = await prisma.payment.create({
        data: {
          userId: patientUserId,
          invoiceId,
          amount: finalAmount,
          purpose: 'therapy_session',
          status: 'pending',
          gatewayOrderId: razorpayOrder.id,
        },
      });

      sessionData.paymentPhase = true;
      sessionData.paymentId = payment.id;

      const now = new Date();
      const paymentExpiresAt = new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);
      sessionData.expiresAt = paymentExpiresAt.toISOString();
      const ttlSeconds = PAYMENT_HOLD_MINUTES * 60;

      await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

      return {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        currency: 'INR',
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: RAZORPAY_API_KEY,
      };
    } catch (error) {
      logger.error('[initiatePayment] Error during payment initiation', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
        patientUserId,
      });
      throw error;
    }
  }

  /**
   * Finalize booking after payment success (called by Webhook or Payment Verification)
   */
  async finalizeBooking(sessionId: string, gatewayPaymentId?: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) {
      return await handleExpiredSessionRefund(sessionId, gatewayPaymentId);
    }

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    return await executeFinalizeBookingTransaction(sessionData, gatewayPaymentId);
  }

  /**
   * Check status of booking
   */
  async getBookingStatus(sessionId: string) {
    const reservation = await prisma.slotReservation.findUnique({
      where: { id: sessionId },
    });
    if (reservation && reservation.status === 'booked') {
      return { status: 'confirmed', reservationId: sessionId };
    }

    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);
    if (!rawData) {
      return { status: 'expired' };
    }

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    return {
      status: sessionData.paymentPhase ? 'payment_pending' : 'form_filling',
      expiresAt: sessionData.expiresAt,
      paymentPhase: sessionData.paymentPhase,
    };
  }

  /**
   * Cancel / abort booking session
   */
  async cancelBookingSession(sessionId: string, patientId: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (rawData) {
      const sessionData = JSON.parse(rawData) as BookingSessionData;
      if (sessionData.patientId === patientId) {
        const dateOnly = new Date(sessionData.date);
        const holdKey = getSlotHoldKey(
          sessionData.therapistId,
          dateOnly.toISOString().split('T')[0] as string,
          sessionData.startHour,
        );
        await Promise.all([redisClient.del(sessionKey), redisClient.del(holdKey)]);
      }
    }

    return { message: 'Booking session cancelled.' };
  }
}

export const bookingSessionService = new BookingSessionService();
