import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';
import { Router } from 'express';
import { treatmentSessionReviewRouter } from './review/treatmentSessionReview.route';
import { treatmentSessionAssessmentRouter } from './assessment/treatmentSessionAssessment.route';
import treatmentSessionController from './treatmentSession.controller';

export const treatmentSessionRouter = Router();

treatmentSessionRouter.use(verifyJWT);

// Sub-routers
treatmentSessionRouter.use('/', treatmentSessionReviewRouter);
treatmentSessionRouter.use('/', treatmentSessionAssessmentRouter);

// ──────────────────────────────────────────────
// Authenticated routes (any role)
// ──────────────────────────────────────────────

// Get session details
treatmentSessionRouter.get('/:id', treatmentSessionController.getSession);

// Notification (can be triggered by either party)
treatmentSessionRouter.post('/:id/notification', treatmentSessionController.sendNotification);

// Cancel session (therapist or patient)
treatmentSessionRouter.post('/:id/cancel', treatmentSessionController.cancelSession);

// No-show (therapist or system)
treatmentSessionRouter.post('/:id/no-show', treatmentSessionController.markNoShow);

// See more slots for follow-up (patient views available slots for existing plan)
treatmentSessionRouter.get('/:id/see-more-slots', treatmentSessionController.seeMoreSlots);

// Book more session on existing treatment plan (patient)
treatmentSessionRouter.post('/book-more-session', treatmentSessionController.bookMoreSession);

// Legacy routes
treatmentSessionRouter.post('/:id/start', treatmentSessionController.startSession);
treatmentSessionRouter.post('/:id/complete', treatmentSessionController.completeSession);

// ──────────────────────────────────────────────
// Therapist-only routes
// ──────────────────────────────────────────────
treatmentSessionRouter.use(TherapistOnly);

// Therapist confirms a pending booking session
treatmentSessionRouter.post('/confirm', treatmentSessionController.confirmBookingSession);

// Therapist sends OTP around start time of session
treatmentSessionRouter.post('/:id/send-otp', treatmentSessionController.sendOtp);

// Therapist verifies OTP to start therapy
treatmentSessionRouter.post('/:id/verify-otp', treatmentSessionController.verifyOtp);

// Therapist reschedules slot
treatmentSessionRouter.post('/:id/reschedule-slot', treatmentSessionController.rescheduleSlot);

// Therapist adds documents related to session
treatmentSessionRouter.post('/:id/add-docs', treatmentSessionController.addDocs);

// Therapist enters improvement record and completes session
treatmentSessionRouter.post(
  '/:id/improvement-record',
  treatmentSessionController.improvementRecord,
);
