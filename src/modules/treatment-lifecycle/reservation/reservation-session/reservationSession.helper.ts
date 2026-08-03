import prisma from '@/config/prisma';
import { softDeleteWhereClause } from '@/core/utils/softdelete';
import { ValidationError, NotFoundError } from '@/core/errors/ApiError';
import { redisClient } from '@/shared/redis';
import { BOOKING_SESSION_PREFIX, getSlotHoldKey } from '@/core/constants/slots';
import { BookingSessionData } from './reservationSession.type';
import { StatusChangeActor, SessionStatus } from '@prisma/client';
import razorpayService from '@/shared/external/razorpay.service';
import { logger } from '@/core/logger/logger';

/**
 * Handles expired session auto-refund when payment completion arrives after Redis key deletion.
 */
export async function handleExpiredSessionRefund(sessionId: string, gatewayPaymentId?: string) {
  // 1. Check if already processed and saved in DB
  const existingReservation = await prisma.slotReservation.findUnique({
    where: { id: sessionId },
  });
  if (existingReservation) {
    return { reservationId: sessionId, message: 'Booking already finalized.' };
  }

  // 2. Redis session expired! Automatically issue Razorpay refund if payment ID exists
  logger.warn('[finalizeBooking] Booking session expired in Redis. Refunding payment.', {
    sessionId,
    gatewayPaymentId,
  });

  if (gatewayPaymentId) {
    try {
      await razorpayService.initiateRefund(gatewayPaymentId, {
        notes: { reason: 'Payment received after booking session expired', sessionId },
      });
      logger.info('[finalizeBooking] Auto-refund issued for expired session payment.', {
        sessionId,
        gatewayPaymentId,
      });
    } catch (refundErr) {
      logger.error('[finalizeBooking] Auto-refund call failed for expired session', {
        refundErr,
        gatewayPaymentId,
      });
    }

    // Update payment status to refunded
    await prisma.payment.updateMany({
      where: {
        OR: [{ gatewayPaymentId }, { id: sessionId }],
      },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
      },
    });
  }

  throw new ValidationError('Booking session expired or not found in Redis.');
}

/**
 * Executes DB transaction to persist SlotReservation, TreatmentPlan, TreatmentSession, Bill, and CouponUsage.
 */
export async function executeFinalizeBookingTransaction(
  sessionData: BookingSessionData,
  gatewayPaymentId?: string,
) {
  const { sessionId, therapistId, patientId, date, startHour, formData, paymentId } = sessionData;

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
  dateOnly.setUTCHours(0, 0, 0, 0);

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

    // Log Session status changes
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
  const sessionKey = `${BOOKING_SESSION_PREFIX}${sessionId}`;
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
 * Validates and calculates discount for coupon application.
 */
export async function applyCouponDiscount(sessionData: BookingSessionData, couponCode: string) {
  const coupon = await prisma.coupon.findFirst({
    where: softDeleteWhereClause({
      code: couponCode.toUpperCase(),
      status: 'active',
      expiresOn: { gt: new Date() },
    }),
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
  const finalPrice = Math.max(0, therapist.price - discountAmount);

  return {
    couponCode: coupon.code,
    discountAmount,
    originalPrice: therapist.price,
    finalPrice,
  };
}
