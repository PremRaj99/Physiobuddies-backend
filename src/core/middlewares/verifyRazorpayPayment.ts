import { ValidationError } from '../errors/ApiError';
import { asyncHandler } from '../response/responseHandler';
import razorpayService from '@/shared/external/razorpay.service';
import { logger } from '../logger/logger';

export const verifyRazorpayPayment = asyncHandler((req, _res, next) => {
  const paymentId = req.body.razorpay_payment_id || req.body.paymentId;
  const orderId = req.body.razorpay_order_id || req.body.orderId || req.body.gatewayOrderId;
  const signature = req.body.razorpay_signature || req.body.signature;

  if (!paymentId || !orderId || !signature) {
    throw new ValidationError(
      'Missing required Razorpay payment verification parameters: paymentId, orderId, signature.',
    );
  }

  const isValid = razorpayService.verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  });

  if (!isValid) {
    logger.warn('Razorpay payment signature verification failed', {
      orderId,
      paymentId,
      userId: req.user?.id,
    });
    throw new ValidationError('Invalid payment signature. Payment verification failed.');
  }

  req.razorpayVerified = {
    orderId,
    paymentId,
  };

  next();
});
