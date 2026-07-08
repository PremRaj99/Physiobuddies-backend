import { Router } from 'express';
import { reservationController } from './reservation.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const reservationRouter = Router();

// Apply auth middleware to all reservation routes
reservationRouter.use(verifyJWT);

// Define reservation-related routes here
reservationRouter.post('/hold', reservationController.holdReservation);
reservationRouter.patch('/:id/confirm', reservationController.confirmReservation);
reservationRouter.delete('/:id', reservationController.cancelReservation);
