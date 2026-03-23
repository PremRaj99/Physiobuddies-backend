import type { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';
import { isAuth } from '@/core/middlewares/isAuth';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class PaymentController {
  async createPaymentOrder(req: Request, res: Response, _next: NextFunction) {
    const { amount, currency, userId, purpose } = req.body;
    await paymentService.createPaymentOrder({ amount, currency, userId, purpose });
    return new CreatedResponse('Payment order created successfully').send(res);
  }

  async verifyPayment(req: Request, res: Response, _next: NextFunction) {
    const { paymentId, orderId, signature } = req.body;
    const isValid = await paymentService.verifyPayment({ paymentId, orderId, signature });
    if (isValid) {
      return new AcceptedResponse('Payment verified successfully').send(res);
    } else {
      return new AcceptedResponse('Payment verification failed').send(res);
    }
  }

  async getPayments(req: Request, res: Response, _next: NextFunction) {
    isAuth(req);
    const userId = req.user.id;
    const payments = await paymentService.getPayments(userId);
    return new OkResponse(payments).send(res);
  }

  async getPaymentById(req: Request, res: Response, _next: NextFunction) {
    isAuth(req);
    const userId = req.user.id;
    const id = validateSchema(ObjectIdSchema, req.params.id);
    const payment = await paymentService.getPaymentById(id, userId);
    return new OkResponse(payment).send(res);
  }
}

export const paymentController = new PaymentController();
