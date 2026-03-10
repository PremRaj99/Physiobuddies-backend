import { Router } from 'express';
import { paymentController } from './payment.controller';

export const paymentRouter = Router();

paymentRouter.post('/create-intent', paymentController.createPaymentOrder);
paymentRouter.post('/confirm', paymentController.verifyPayment);
paymentRouter.get('/', paymentController.getPayments);
paymentRouter.get('/:id', paymentController.getPaymentById);
