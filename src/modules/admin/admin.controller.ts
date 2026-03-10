import type { NextFunction, Request, Response } from 'express';

class AdminController {
  // Example method
  async getDashboard(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllPayments(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllCommissions(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllPayouts(_req: Request, _res: Response, _next: NextFunction) {}

  async processPayout(_req: Request, _res: Response, _next: NextFunction) {}

  async processRefund(_req: Request, _res: Response, _next: NextFunction) {}
}

export const adminController = new AdminController();
