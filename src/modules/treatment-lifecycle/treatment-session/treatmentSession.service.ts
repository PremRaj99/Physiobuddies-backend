import prisma from '@/config/prisma';
import { NotFoundError, ValidationError } from '@/core/errors/ApiError';
import { SLOT_DURATION, getSlotHoldKey } from '@/core/constants/slots';
import { SessionStatus, StatusChangeActor } from '@prisma/client';
import { statusLogService } from '@/modules/treatment-lifecycle/statusLog.service';
import { therapistService } from '@/modules/identity/therapist/therapist.service';
import { patientService } from '@/modules/identity/patient/patient.service';
import { SlotManager } from '@/modules/treatment-lifecycle/reservation/reservation-session/slotManagement';
import { redisClient } from '@/shared/redis';
import { sendMail } from '@/shared/mailHandler';
import { createAndStoreOTP, verifyOTP } from '@/modules/identity/auth/otp-management';
import {
  isWithinOtpWindow,
  isWithinCancellationWindow,
  assertTherapistOwnership,
  assertSessionStatus,
  buildOtpEmailHtml,
} from './treatmentSession.helper';
import type {
  RescheduleSlotDTO,
  AddDocsDTO,
  ImprovementRecordDTO,
  BookMoreSessionDTO,
} from './treatmentSession.type';

class SessionService {
  // ─────────────────────────────────────────────────────
  // GET SESSION
  // ─────────────────────────────────────────────────────
  async getSession(sessionId: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: {
        treatmentPlan: {
          include: {
            patient: { select: { id: true, user: { select: { name: true, image: true } } } },
            therapist: { select: { id: true, user: { select: { name: true, image: true } } } },
          },
        },
        reservation: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        improvementRecord: true,
        rescheduleLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!session) throw new NotFoundError('Treatment session not found.');
    return session;
  }

  // ─────────────────────────────────────────────────────
  // CONFIRM BOOKING SESSION (therapist confirms pending → confirmed)
  // ─────────────────────────────────────────────────────
  async confirmBookingSession(sessionId: string, therapistUserId: string) {
    const therapist = await therapistService.getTherapistByUserId(therapistUserId);

    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertTherapistOwnership(session, therapist.id);
    assertSessionStatus(session, ['pending'], 'confirm');

    // Validate transition then update
    statusLogService.validateSessionTransition(
      session.status as SessionStatus,
      SessionStatus.confirmed,
    );

    await prisma.$transaction(async (tx) => {
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.confirmed },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: session.status as SessionStatus,
          toStatus: SessionStatus.confirmed,
          changedBy: StatusChangeActor.therapist,
          changedByUserId: therapistUserId,
          reason: 'Therapist confirmed the session',
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────
  // SEND NOTIFICATION (1hr before session)
  // ─────────────────────────────────────────────────────
  async sendNotification(sessionId: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: {
        treatmentPlan: {
          include: {
            patient: { select: { userId: true } },
            therapist: { select: { userId: true } },
          },
        },
      },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    const now = new Date();
    const userIds = [session.treatmentPlan.patient.userId, session.treatmentPlan.therapist.userId];

    const notifications = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            title: 'Upcoming Session Reminder',
            description: `Your therapy session is starting soon. Please be ready.`,
            isRead: false,
            priority: 'high',
            time: now,
          },
        }),
      ),
    );

    return notifications.map((n) => n.id);
  }

  // ─────────────────────────────────────────────────────
  // SEND OTP (therapist triggers → patient gets OTP via email)
  // Managed entirely in Redis (no DB stored OTP) with rate limiting & anti-abuse
  // ─────────────────────────────────────────────────────
  async sendOtp(sessionId: string, therapistUserId: string) {
    const therapist = await therapistService.getTherapistByUserId(therapistUserId);

    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: {
        treatmentPlan: true,
        reservation: true,
      },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertTherapistOwnership(session, therapist.id);
    assertSessionStatus(session, ['confirmed'], 'send OTP');

    // Time check: same date, within 10 min before start and within session time
    if (!isWithinOtpWindow(session.date, session.reservation.startHour, SLOT_DURATION, 10)) {
      throw new ValidationError(
        'OTP can only be sent within 10 minutes before the session start time and during the session.',
      );
    }

    // Generate & store OTP in Redis with anti-abuse rate limits (60s cooldown, max 3 attempts/hr)
    const otp = await createAndStoreOTP(sessionId, 'session_otp');

    // Send OTP via email to the patient
    const patient = await prisma.patient.findUnique({
      where: { id: session.treatmentPlan.patientId },
      include: { user: { select: { email: true, name: true } } },
    });

    const therapistUser = await prisma.user.findUnique({
      where: { id: therapistUserId },
      select: { name: true },
    });

    if (patient?.user?.email) {
      const html = buildOtpEmailHtml(otp, therapistUser?.name || 'Your Therapist', session.date);

      await sendMail(
        patient.user.email,
        'Physiobuddies – Your Session OTP',
        `Your session OTP is: ${otp}. It expires in 5 minutes.`,
        html,
      );
    }

    // TODO: Implement SMS integration for OTP delivery
    // await sendSms(patient.user.phone, `Your Physiobuddies session OTP is: ${otp}`);

    return { message: 'OTP sent to patient successfully.', expiresInMinutes: 5 };
  }

  // ─────────────────────────────────────────────────────
  // VERIFY OTP (therapist submits → confirmed → active)
  // Managed entirely in Redis (no DB stored OTP)
  // ─────────────────────────────────────────────────────
  async verifyOtp(sessionId: string, otp: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertSessionStatus(session, ['confirmed'], 'verify OTP');

    // Verifies OTP in Redis & deletes it upon success (throws ValidationError if invalid or expired)
    await verifyOTP(sessionId, otp, 'session_otp');

    statusLogService.validateSessionTransition(SessionStatus.confirmed, SessionStatus.active);

    await prisma.$transaction(async (tx) => {
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.active,
          actualStartTime: new Date(),
        },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: SessionStatus.confirmed,
          toStatus: SessionStatus.active,
          changedBy: StatusChangeActor.therapist,
          reason: 'OTP verified via Redis — session started',
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────
  // START SESSION (legacy — without OTP, kept for backward compat)
  // ─────────────────────────────────────────────────────
  async startSession(sessionId: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertSessionStatus(session, ['confirmed'], 'start');

    statusLogService.validateSessionTransition(SessionStatus.confirmed, SessionStatus.active);

    await prisma.$transaction(async (tx) => {
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.active,
          actualStartTime: new Date(),
        },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: SessionStatus.confirmed,
          toStatus: SessionStatus.active,
          changedBy: StatusChangeActor.system,
          reason: 'Session started (legacy)',
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────
  // RESCHEDULE SLOT
  // ─────────────────────────────────────────────────────
  async rescheduleSlot(sessionId: string, therapistUserId: string, dto: RescheduleSlotDTO) {
    const therapist = await therapistService.getTherapistByUserId(therapistUserId);

    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true, reservation: true },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertTherapistOwnership(session, therapist.id);
    assertSessionStatus(session, ['pending', 'confirmed'], 'reschedule');

    const newDateOnly = new Date(dto.date);
    newDateOnly.setUTCHours(0, 0, 0, 0);

    // Hold the new slot via SlotManager
    const holdResult = await SlotManager.holdSlot(
      therapist.id,
      session.treatmentPlan.patientId,
      newDateOnly,
      dto.startHour,
    );

    const newSlotStart = new Date(newDateOnly);
    newSlotStart.setUTCHours(dto.startHour, 0, 0, 0);
    const newSlotEnd = new Date(newSlotStart.getTime() + SLOT_DURATION * 60 * 1000);

    const oldReservationId = session.reservationId;
    const oldDate = session.date;
    const oldStartHour = session.reservation.startHour;

    await prisma.$transaction(async (tx) => {
      // Create new SlotReservation
      const newReservation = await tx.slotReservation.create({
        data: {
          id: holdResult.reservationId,
          therapistId: therapist.id,
          patientId: session.treatmentPlan.patientId,
          date: newDateOnly,
          startHour: dto.startHour,
          startTime: newSlotStart,
          endTime: newSlotEnd,
          status: 'booked',
        },
      });

      // Update the session to point to the new reservation
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          reservationId: newReservation.id,
          date: newDateOnly,
        },
      });

      // Soft-delete old reservation
      await tx.slotReservation.update({
        where: { id: oldReservationId },
        data: { deletedAt: new Date() },
      });

      // Create audit trail
      await tx.sessionRescheduleLog.create({
        data: {
          sessionId,
          oldDate,
          oldStartHour,
          newDate: newDateOnly,
          newStartHour: dto.startHour,
          oldReservationId,
          newReservationId: newReservation.id,
          changedBy: StatusChangeActor.therapist,
          changedByUserId: therapistUserId,
          reason: dto.reason || 'Therapist rescheduled the session',
        },
      });
    });

    // Release the old slot hold from Redis
    const oldHoldKey = getSlotHoldKey(
      therapist.id,
      oldDate.toISOString().split('T')[0] as string,
      oldStartHour,
    );
    await redisClient.del(oldHoldKey);

    return { message: 'Session rescheduled successfully.' };
  }

  // ─────────────────────────────────────────────────────
  // CANCEL SESSION
  // ─────────────────────────────────────────────────────
  async cancelSession(sessionId: string, userId: string, role: string, reason?: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true, reservation: true },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertSessionStatus(session, ['pending', 'confirmed'], 'cancel');

    if (!isWithinCancellationWindow(session.date, session.reservation.startHour)) {
      throw new ValidationError('Cannot cancel: session start time has already passed.');
    }

    const cancelledBy = role === 'therapist' ? 'therapist' : 'patient';
    const actor = role === 'therapist' ? StatusChangeActor.therapist : StatusChangeActor.patient;

    statusLogService.validateSessionTransition(
      session.status as SessionStatus,
      SessionStatus.cancelled,
    );

    await prisma.$transaction(async (tx) => {
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.cancelled,
          cancelledBy,
          cancelledAt: new Date(),
          cancellationReason: reason || null,
        },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: session.status as SessionStatus,
          toStatus: SessionStatus.cancelled,
          changedBy: actor,
          changedByUserId: userId,
          reason: reason || `Session cancelled by ${cancelledBy}`,
        },
      });

      // Soft-delete the slot reservation
      await tx.slotReservation.update({
        where: { id: session.reservationId },
        data: { deletedAt: new Date() },
      });
    });

    // Release slot hold from Redis
    const holdKey = getSlotHoldKey(
      session.treatmentPlan.therapistId,
      session.date.toISOString().split('T')[0] as string,
      session.reservation.startHour,
    );
    await redisClient.del(holdKey);
  }

  // ─────────────────────────────────────────────────────
  // MARK NO-SHOW
  // ─────────────────────────────────────────────────────
  async markNoShow(sessionId: string, userId?: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertSessionStatus(session, ['confirmed', 'active'], 'mark no-show');

    statusLogService.validateSessionTransition(
      session.status as SessionStatus,
      SessionStatus.no_show,
    );

    await prisma.$transaction(async (tx) => {
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.no_show },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: session.status as SessionStatus,
          toStatus: SessionStatus.no_show,
          changedBy: userId ? StatusChangeActor.therapist : StatusChangeActor.system,
          changedByUserId: userId || null,
          reason: userId ? 'Marked as no-show' : 'Auto no-show by system',
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────
  // ADD DOCS (to treatment plan, optionally linked to session)
  // ─────────────────────────────────────────────────────
  async addDocs(sessionId: string, therapistUserId: string, dto: AddDocsDTO) {
    const therapist = await therapistService.getTherapistByUserId(therapistUserId);

    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertTherapistOwnership(session, therapist.id);

    const docRecords = await prisma.$transaction(
      dto.documents.map((doc) =>
        prisma.treatmentPlanDocRecord.create({
          data: {
            treatmentPlanId: session.treatmentPlanId,
            sessionId,
            url: doc.url,
            name: doc.name,
            fileType: doc.fileType,
            uploadedBy: StatusChangeActor.therapist,
            uploadedByUserId: therapistUserId,
          },
        }),
      ),
    );

    return docRecords;
  }

  // ─────────────────────────────────────────────────────
  // IMPROVEMENT RECORD (therapist fills → active → completed)
  // ─────────────────────────────────────────────────────
  async improvementRecord(sessionId: string, therapistUserId: string, dto: ImprovementRecordDTO) {
    const therapist = await therapistService.getTherapistByUserId(therapistUserId);

    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
      include: { treatmentPlan: true },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertTherapistOwnership(session, therapist.id);

    const sessionsInPlan = await prisma.treatmentSession.findMany({
      where: { treatmentPlanId: session.treatmentPlanId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const firstSession = sessionsInPlan[0];
    if (firstSession && firstSession.id === session.id) {
      throw new ValidationError(
        'Session improvement record is not accepted for the 1st session. Please complete the clinical assessment instead.',
      );
    }

    assertSessionStatus(session, ['active'], 'record improvement');

    statusLogService.validateSessionTransition(SessionStatus.active, SessionStatus.completed);

    await prisma.$transaction(async (tx) => {
      // Create improvement record
      await tx.treatmentSessionImprovementRecord.create({
        data: {
          sessionId,
          painScoreBefore: dto.painScoreBefore ?? null,
          painScoreAfter: dto.painScoreAfter,
          improvementNotes: dto.improvementNotes,
          exercisesGiven: dto.exercisesGiven || [],
        },
      });

      // Complete the session
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.completed,
          actualEndTime: new Date(),
        },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: SessionStatus.active,
          toStatus: SessionStatus.completed,
          changedBy: StatusChangeActor.therapist,
          changedByUserId: therapistUserId,
          reason: 'Improvement record submitted — session completed',
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────
  // COMPLETE SESSION (legacy — without improvement record)
  // ─────────────────────────────────────────────────────
  async completeSession(sessionId: string) {
    const session = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundError('Treatment session not found.');

    assertSessionStatus(session, ['active'], 'complete');

    statusLogService.validateSessionTransition(SessionStatus.active, SessionStatus.completed);

    await prisma.$transaction(async (tx) => {
      await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.completed,
          actualEndTime: new Date(),
        },
      });

      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId,
          fromStatus: SessionStatus.active,
          toStatus: SessionStatus.completed,
          changedBy: StatusChangeActor.system,
          reason: 'Session completed (legacy)',
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────
  // SEE MORE SLOTS (for follow-up sessions on existing treatment plan)
  // ─────────────────────────────────────────────────────
  async seeMoreSlots(treatmentPlanId: string) {
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: {
        clinicalAssessments: {
          select: { visitFrequency: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!plan) throw new NotFoundError('Treatment plan not found.');

    // Use the therapist's availability endpoint logic
    // Returns available slots from today + 3 days
    const availability = await therapistService.getTherapistAvailability(plan.therapistId);

    return {
      treatmentPlanId: plan.id,
      recommendationRule: plan.recommendationRule,
      visitFrequency: plan.clinicalAssessments?.[0]?.visitFrequency || null,
      suggestedTreatmentDays: plan.suggestedTreatmentDays,
      availableSlots: availability,
    };
  }

  // ─────────────────────────────────────────────────────
  // BOOK MORE SESSION (add a session to existing treatment plan)
  // ─────────────────────────────────────────────────────
  async bookMoreSession(patientUserId: string, dto: BookMoreSessionDTO) {
    const patient = await patientService.getPatientByUserId(patientUserId);

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: dto.treatmentPlanId },
      include: {
        therapist: { include: { user: true } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!plan) throw new NotFoundError('Treatment plan not found.');

    if (plan.patientId !== patient.id) {
      throw new ValidationError('This treatment plan does not belong to you.');
    }

    if (['completed', 'cancelled', 'abandoned'].includes(plan.status)) {
      throw new ValidationError(`Cannot add sessions: treatment plan is ${plan.status}.`);
    }

    const newDateOnly = new Date(dto.date);
    newDateOnly.setUTCHours(0, 0, 0, 0);

    // Hold the slot
    const holdResult = await SlotManager.holdSlot(
      plan.therapistId,
      patient.id,
      newDateOnly,
      dto.startHour,
    );

    const slotStart = new Date(newDateOnly);
    slotStart.setUTCHours(dto.startHour, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000);

    // Get snapshots from the last session on this plan
    const lastSession = plan.sessions[0];

    const result = await prisma.$transaction(async (tx) => {
      // Create SlotReservation
      const reservation = await tx.slotReservation.create({
        data: {
          id: holdResult.reservationId,
          therapistId: plan.therapistId,
          patientId: patient.id,
          date: newDateOnly,
          startHour: dto.startHour,
          startTime: slotStart,
          endTime: slotEnd,
          status: 'booked',
        },
      });

      // Create TreatmentSession on the existing plan
      const session = await tx.treatmentSession.create({
        data: {
          treatmentPlanId: plan.id,
          reservationId: reservation.id,
          date: newDateOnly,
          status: SessionStatus.pending,
          mode: lastSession?.mode || plan.therapist.mode || 'home_visit',
          condition: lastSession?.condition || 'Follow-up Therapy',
          DescribedAs: 'Follow-up therapy session',
          priceAtBooking: plan.therapist.price,
          therapistSnapshot:
            lastSession?.therapistSnapshot || JSON.parse(JSON.stringify(plan.therapist)),
          patientDetailSnapshot: lastSession?.patientDetailSnapshot || {},
          addressSnapshot: lastSession?.addressSnapshot || {},
        },
      });

      // Log status: null → pending
      await tx.treatmentSessionStatusLog.create({
        data: {
          sessionId: session.id,
          fromStatus: null,
          toStatus: SessionStatus.pending,
          changedBy: StatusChangeActor.patient,
          changedByUserId: patientUserId,
          reason: 'Follow-up session booked on existing treatment plan',
        },
      });

      // Update plan status to ongoing if it was created/treatment_planned
      if (plan.status === 'created' || plan.status === 'treatment_planned') {
        await tx.treatmentPlan.update({
          where: { id: plan.id },
          data: { status: 'ongoing' },
        });

        await tx.treatmentPlanStatusLog.create({
          data: {
            treatmentPlanId: plan.id,
            fromStatus: plan.status,
            toStatus: 'ongoing',
            changedBy: StatusChangeActor.system,
            reason: 'Follow-up session added — plan now ongoing',
          },
        });
      }

      return { reservation, session };
    });

    // Clean up Redis hold
    const holdKey = getSlotHoldKey(
      plan.therapistId,
      newDateOnly.toISOString().split('T')[0] as string,
      dto.startHour,
    );
    await redisClient.del(holdKey);

    return {
      sessionId: result.session.id,
      reservationId: result.reservation.id,
      message: 'Follow-up session booked successfully.',
    };
  }
}

export default new SessionService();
