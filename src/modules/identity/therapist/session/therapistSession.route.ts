import { Router } from 'express';
import therapistSessionController from './therapistSession.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistSessionRouter = Router();

therapistSessionRouter.use(verifyJWT);
therapistSessionRouter.use(TherapistOnly);

therapistSessionRouter.get('/my-bookings', therapistSessionController.getMyBookings);
therapistSessionRouter.get('/my-bookings/:id', therapistSessionController.getBookingById);
therapistSessionRouter.get('/today', therapistSessionController.getTodaySessions);
therapistSessionRouter.get('/upcoming', therapistSessionController.getUpcomingSessions);
