import type { Request, Response, NextFunction } from 'express';

class PaymentController {
  async createPaymentOrder(_req: Request, _res: Response, _next: NextFunction) {}

  async verifyPayment(_req: Request, _res: Response, _next: NextFunction) {}

  async getPayments(_req: Request, _res: Response, _next: NextFunction) {}

  async getPaymentById(_req: Request, _res: Response, _next: NextFunction) {}
}

export const paymentController = new PaymentController();
