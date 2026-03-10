import type { Request, Response, NextFunction } from 'express';

class PaymentController {
  async createPaymentOrder(req: Request, res: Response, next: NextFunction) { }

  async verifyPayment(req: Request, res: Response, next: NextFunction) { }

  async getPayments(req: Request, res: Response, next: NextFunction) { }

  async getPaymentById(req: Request, res: Response, next: NextFunction) { }
}

export const paymentController = new PaymentController();
