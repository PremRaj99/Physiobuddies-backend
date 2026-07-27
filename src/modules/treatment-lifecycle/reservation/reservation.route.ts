import { Router } from 'express';
import { reservationSessionRouter } from './reservation-session/reservationSession.rotue';

export const reservationRouter = Router();

// Booking Session routes
reservationRouter.use('/session', reservationSessionRouter);
