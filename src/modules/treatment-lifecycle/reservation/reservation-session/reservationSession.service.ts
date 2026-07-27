import prisma from '@/config/prisma';
import { ValidationError, NotFoundError } from '@/core/errors/ApiError';
import { redisClient } from '@/shared/redis';
import {
  BOOKING_SESSION_PREFIX,
  HOLD_DURATION_MINUTES,
  getSlotHoldKey,
} from '@/core/constants/slots';
import { SlotManager } from './slotManagement';
import { generateInvoiceId } from '@/modules/billing-ledger/payment/generateInvoiceId';
import { BookingSessionData, UpdateBookingFormDTO } from './reservationSession.type';
import { StatusChangeActor, SessionStatus } from '@prisma/client';

class BookingSessionService {
  /**
   * Step 1: Create a secure booking session in Redis
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

    // Delegate slot hold logic to SlotManager (creates Redis hold)
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
    const ttlSeconds = HOLD_DURATION_MINUTES * 60; // 20 minutes

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    return {
      sessionId: reservationId,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt,
    };
  }

  /**
   * Get booking session state from Redis (with therapist info for display)
   */
  async getBookingSession(sessionId: string, patientId: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) {
      // Check if already confirmed in DB
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

    // Fetch therapist details for display
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

    // Calculate remaining TTL
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

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        status: 'active',
        expiresOn: { gt: new Date() },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    if (!coupon) {
      throw new ValidationError('Invalid or expired coupon code.');
    }

    // Get therapist price
    const therapist = await prisma.therapist.findUnique({
      where: { id: sessionData.therapistId },
      select: { price: true },
    });

    if (!therapist) throw new NotFoundError('Therapist not found.');

    if (therapist.price < coupon.minPrice) {
      throw new ValidationError(`Coupon requires minimum booking amount of ₹${coupon.minPrice}`);
    }

    const discountAmount = coupon.discount;
    sessionData.formData.couponCode = coupon.code;
    sessionData.formData.couponDiscount = discountAmount;

    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    const finalPrice = Math.max(0, therapist.price - discountAmount);

    return {
      message: 'Coupon applied successfully!',
      couponCode: coupon.code,
      discount: discountAmount,
      originalPrice: therapist.price,
      finalPrice,
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
   * Initiate payment step - creates pending Payment record
   */
  async initiatePayment(sessionId: string, patientUserId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId: patientUserId } });
    if (!patient) throw new NotFoundError('Patient not found.');

    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) throw new NotFoundError('Booking session expired or not found.');

    const sessionData = JSON.parse(rawData) as BookingSessionData;

    const therapist = await prisma.therapist.findUnique({ where: { id: sessionData.therapistId } });
    if (!therapist) throw new NotFoundError('Therapist not found.');

    const finalAmount = Math.max(0, therapist.price - (sessionData.formData.couponDiscount || 0));

    // Create payment in DB
    const payment = await prisma.payment.create({
      data: {
        userId: patientUserId,
        invoiceId: generateInvoiceId(),
        amount: finalAmount,
        purpose: 'therapy_session',
        status: 'pending',
      },
    });

    sessionData.paymentPhase = true;
    sessionData.paymentId = payment.id;

    // Extend hold by remaining TTL
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: ttlSeconds });

    return {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: 'INR',
    };
  }

  /**
   * Finalize booking after payment success (called by Webhook or Payment Verification)
   */
  async finalizeBooking(sessionId: string, gatewayPaymentId?: string) {
    const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
    const rawData = await redisClient.get(sessionKey);

    if (!rawData) {
      // Check if already processed
      const existingReservation = await prisma.slotReservation.findUnique({
        where: { id: sessionId },
      });
      if (existingReservation) {
        return { reservationId: sessionId, message: 'Booking already finalized.' };
      }
      throw new ValidationError('Booking session expired or not found in Redis.');
    }

    const sessionData = JSON.parse(rawData) as BookingSessionData;
    const { therapistId, patientId, date, startHour, formData, paymentId } = sessionData;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      include: { user: true },
    });

    if (!patient || !therapist) {
      throw new NotFoundError('Patient or Therapist profile missing.');
    }

    const patientDetail = formData.patientDetailId
      ? await prisma.patientDetail.findUnique({ where: { id: formData.patientDetailId } })
      : await prisma.patientDetail.findFirst({ where: { patientId } });

    const patientLocation = formData.locationId
      ? await prisma.patientLocation.findUnique({ where: { id: formData.locationId } })
      : await prisma.patientLocation.findFirst({ where: { patientId } });

    const dateOnly = new Date(date);
    const slotStart = new Date(dateOnly);
    slotStart.setUTCHours(startHour, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 40 * 60 * 1000);

    // Atomically create all DB records
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create SlotReservation
      const reservation = await tx.slotReservation.create({
        data: {
          id: sessionId,
          therapistId,
          patientId,
          date: dateOnly,
          startHour,
          startTime: slotStart,
          endTime: slotEnd,
          status: 'booked',
        },
      });

      // 2. Create TreatmentPlan
      const treatmentPlan = await tx.treatmentPlan.create({
        data: {
          patientId,
          therapistId,
          locationId: patientLocation?.id || '600000000000000000000000',
          patientDetailId: patientDetail?.id || '600000000000000000000000',
          status: 'created',
          patientDetailsSnapshot: patientDetail ? JSON.parse(JSON.stringify(patientDetail)) : {},
          locationSnapshot: patientLocation ? JSON.parse(JSON.stringify(patientLocation)) : {},
          therapistSnapshot: JSON.parse(JSON.stringify(therapist)),
        },
      });

      // Log TreatmentPlan creation status
      await tx.treatmentPlanStatusLog.create({
        data: {
          treatmentPlanId: treatmentPlan.id,
          fromStatus: null,
          toStatus: 'created',
          changedBy: StatusChangeActor.system,
          reason: 'Initial Booking Created',
        },
      });

      // 3. Create TreatmentSession
      const session = await tx.treatmentSession.create({
        data: {
          treatmentPlanId: treatmentPlan.id,
          reservationId: reservation.id,
          date: dateOnly,
          status: 'confirmed',
          mode: therapist.mode || 'home_visit',
          condition: formData.conditionId || 'General Therapy',
          DescribedAs: formData.problemDesc || 'Scheduled therapy session',
          priceAtBooking: therapist.price - (formData.couponDiscount || 0),
          therapistSnapshot: JSON.parse(JSON.stringify(therapist)),
          patientDetailSnapshot: patientDetail ? JSON.parse(JSON.stringify(patientDetail)) : {},
          addressSnapshot: patientLocation ? JSON.parse(JSON.stringify(patientLocation)) : {},
        },
      });

      // Log Session status changes: null -> pending, then pending -> confirmed
      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId: session.id,
          fromStatus: null,
          toStatus: SessionStatus.pending,
          changedBy: StatusChangeActor.system,
          reason: 'Session Reserved',
        },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId: session.id,
          fromStatus: SessionStatus.pending,
          toStatus: SessionStatus.confirmed,
          changedBy: StatusChangeActor.system,
          reason: 'Payment Webhook Verified',
        },
      });

      // 4. Update Payment status
      if (paymentId) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'completed',
            paidAt: new Date(),
            gatewayPaymentId: gatewayPaymentId || null,
          },
        });

        // 5. Create TreatmentSessionBill
        await tx.treatmentSessionBill.create({
          data: {
            paymentId,
            sessionId: session.id,
            sessionDate: dateOnly,
            therapistId,
            patientId,
            amountAllocated: therapist.price - (formData.couponDiscount || 0),
            status: 'unclaimed',
            paymentAmountMetaData: { amount: therapist.price },
          },
        });
      }

      // 6. Handle Coupon Usage if coupon was applied
      if (formData.couponCode) {
        const coupon = await tx.coupon.findFirst({
          where: { code: formData.couponCode },
        });
        if (coupon) {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              patientId,
              treatmentSessionId: session.id,
              status: 'consumed',
              usedAt: new Date(),
              paymentId: paymentId || null,
            },
          });
        }
      }

      return { reservation, treatmentPlan, session };
    });

    // Cleanup Redis keys
    const holdKey = getSlotHoldKey(
      therapistId,
      dateOnly.toISOString().split('T')[0] as string,
      startHour,
    );
    await Promise.all([redisClient.del(sessionKey), redisClient.del(holdKey)]);

    return {
      reservationId: result.reservation.id,
      sessionId: result.session.id,
      message: 'Booking finalized and saved to database successfully',
    };
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
