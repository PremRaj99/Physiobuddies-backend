import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { Router } from 'express';
import { treatmentSessionReviewRouter } from './review/treatmentSessionReview.route';
import treatmentSessionController from './treatmentSession.controller';
// import { treatmentSessionAssessmentRouter } from './assessment/treatmentSessionAssessment.route';

export const treatmentSessionRouter = Router();

treatmentSessionRouter.use(verifyJWT);

treatmentSessionRouter.use('/', treatmentSessionReviewRouter);

// new Route
// therapist confirm booking session
// treatmentSessionRouter.post('/confirm', treatmentSessionController.confirmBookingSession);

// therapist and patient get Notification before 1hrs of scheduled time
// treatmentSessionRouter.post('/notification', treatmentSessionController.sendNotification);

// therapist send OTP at arround start time of session
// treatmentSessionRouter.post('/:id/send-otp', treatmentSessionController.sendOtp);

// therapist verify OTP and start therapy
// treatmentSessionRouter.post('/:id/verify-otp', treatmentSessionController.verifyOtp);

// therapist reschdule slot (in this should show available slots to therapist)
// treatmentSessionRouter.post('/:id/reschdule-slot', treatmentSessionController.reschduleSlot);

// therapist cancel session (in this should send notification to patient)
// treatmentSessionRouter.post('/:id/cancel', treatmentSessionController.cancelSession);

// no-show and cancel at start time or before 1 hr of session if not confirm by therapist or after 1 hr of session if started but not end.
// treatmentSessionRouter.post('/:id/no-show', treatmentSessionController.markNoShow);

// therapist can generate assessment
// treatmentSessionRouter.use('/assessment/:sessionId', treatmentSessionAssessmentRouter);

// therapist add docs related to session
// treatmentSessionRouter.post('/:id/add-docs', treatmentSessionController.addDocs);

// therapist enter improvement record after each treatment session and complete that session
// treatmentSessionRouter.post('/:id/improvement-record', treatmentSessionController.improvementRecord);

// patient and therapist can give feedback/ review related to session
// treatmentSessionRouter.post('/:id/feedback', treatmentSessionController.giveFeedback);

// after 1st treatment session patient can see more slots according to recomendation for same treatment plan eg: 5 session alternate day or 5 session in a week or 5 session in 10 days
// treatmentSessionRouter.post('/:id/see-more-slots', treatmentSessionController.seeMoreSlots);

// after 1st treatment session patient can book more session according to recomendation for same treatment plan by paying
// treatmentSessionRouter.post('/:id/book-more-session', treatmentSessionController.bookMoreSession);

// if no-show for 1 week then treatment plan will be completed or therapist complete the session
// treatmentSessionRouter.post('/:id/complete', treatmentSessionController.completeSession);

// legacy routes
treatmentSessionRouter.post('/:id/start', treatmentSessionController.startSession);
treatmentSessionRouter.post('/:id/complete', treatmentSessionController.completeSession);
treatmentSessionRouter.post('/:id/no-show', treatmentSessionController.markNoShow);
treatmentSessionRouter.post('/:id/cancel', treatmentSessionController.cancelSession);
