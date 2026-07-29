import { isAuth } from '@/core/middlewares/isAuth';
import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import type { NextFunction, Request, Response } from 'express';
import { paymentService } from './payment.service';

class PaymentController {
  createPaymentOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id;
    const { amount, currency, purpose, receipt, notes } = req.body;

    const result = await paymentService.createPaymentOrder({
      amount,
      currency,
      userId,
      purpose,
      receipt,
      notes,
    });

    return new OkResponse(result).send(res);
  });

  verifyPayment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const paymentId = req.body.razorpay_payment_id || req.body.paymentId;
    const orderId = req.body.razorpay_order_id || req.body.orderId || req.body.gatewayOrderId;
    const signature = req.body.razorpay_signature || req.body.signature;
    const { internalPaymentId, sessionId } = req.body;

    const result = await paymentService.verifyPayment({
      paymentId,
      orderId,
      signature,
      internalPaymentId,
      sessionId,
    });

    return new OkResponse(result).send(res);
  });

  refundPayment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const id = String(req.params.id);
    const { amount, reason } = req.body;

    const result = await paymentService.refundPayment({
      paymentId: id,
      amount,
      reason,
    });

    return new OkResponse(result).send(res);
  });

  getRefundStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const id = String(req.params.id);
    const refundId = String(req.params.refundId);

    const result = await paymentService.getRefundStatus(id, refundId);
    return new OkResponse(result).send(res);
  });

  checkPaymentStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const id = String(req.params.id);

    const result = await paymentService.checkPaymentStatus(id);
    return new OkResponse(result).send(res);
  });

  getPayments = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id;
    const payments = await paymentService.getPayments(userId);
    return new OkResponse(payments).send(res);
  });

  getPaymentById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id;
    const id = String(req.params.id);
    const payment = await paymentService.getPaymentById(id, userId);
    return new OkResponse(payment).send(res);
  });
}

export const paymentController = new PaymentController();
