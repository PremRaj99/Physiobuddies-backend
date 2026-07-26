import { Router } from 'express';
import therapistSessionController from './therapistSession.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistSessionRouter = Router();

therapistSessionRouter.use(verifyJWT);
therapistSessionRouter.use(TherapistOnly);

therapistSessionRouter.get('/my-bookings', therapistSessionController.getMyBookings);
therapistSessionRouter.get('/my-bookings/:id', therapistSessionController.getBookingById);
therapistSessionRouter.patch('/my-bookings/:id/accept', therapistSessionController.acceptBooking);
therapistSessionRouter.post(
  '/my-bookings/:id/generate-otp',
  therapistSessionController.generateOtp,
);
therapistSessionRouter.post('/my-bookings/:id/verify-otp', therapistSessionController.verifyOtp);
therapistSessionRouter.post('/my-bookings/:id/end', therapistSessionController.endSession);
therapistSessionRouter.post('/plan/:id/complete', therapistSessionController.completePlan);
therapistSessionRouter.get('/today', therapistSessionController.getTodaySessions);
therapistSessionRouter.get('/upcoming', therapistSessionController.getUpcomingSessions);
