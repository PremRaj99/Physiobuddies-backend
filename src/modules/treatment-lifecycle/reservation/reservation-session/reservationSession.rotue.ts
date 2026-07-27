import { Router } from 'express';
import { reservationSessionController } from './reservationSession.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
export const reservationSessionRouter = Router();

reservationSessionRouter.use(verifyJWT);

reservationSessionRouter.post('/', reservationSessionController.createBookingSession);
reservationSessionRouter.get('/:id', reservationSessionController.getBookingSession);
reservationSessionRouter.patch('/:id/form', reservationSessionController.updateBookingForm);
reservationSessionRouter.post('/:id/apply-coupon', reservationSessionController.applyCoupon);
reservationSessionRouter.delete('/:id/remove-coupon', reservationSessionController.removeCoupon);
reservationSessionRouter.post(
  '/:id/initiate-payment',
  reservationSessionController.initiatePayment,
);
reservationSessionRouter.get('/:id/status', reservationSessionController.getBookingStatus);
reservationSessionRouter.post('/:id/finalize', reservationSessionController.finalizeBooking);
