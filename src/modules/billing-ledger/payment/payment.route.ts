import { Router } from 'express';
import { paymentController } from './payment.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { verifyRazorpayPayment } from '@/core/middlewares/verifyRazorpayPayment';

export const paymentRouter = Router();

// Public / client callback route for payment verification (uses signature verification)
paymentRouter.post('/confirm', verifyRazorpayPayment, paymentController.verifyPayment);

// Authenticated routes
paymentRouter.use(verifyJWT);

paymentRouter.post('/create-intent', paymentController.createPaymentOrder);
paymentRouter.get('/', paymentController.getPayments);
paymentRouter.get('/:id', paymentController.getPaymentById);

// Refund and status check routes
paymentRouter.post('/:id/refund', paymentController.refundPayment);
paymentRouter.get('/:id/refund/:refundId', paymentController.getRefundStatus);
paymentRouter.get('/:id/check-status', paymentController.checkPaymentStatus);
