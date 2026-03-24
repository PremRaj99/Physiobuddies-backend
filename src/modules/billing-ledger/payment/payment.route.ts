import { Router } from 'express';
import { paymentController } from './payment.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const paymentRouter = Router();

paymentRouter.use(verifyJWT);

paymentRouter.post('/create-intent', paymentController.createPaymentOrder);
paymentRouter.post('/confirm', paymentController.verifyPayment);
paymentRouter.get('/', paymentController.getPayments);
paymentRouter.get('/:id', paymentController.getPaymentById);
