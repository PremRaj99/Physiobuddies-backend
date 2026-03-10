import type { NextFunction, Request, Response } from 'express';

class AdminController {
  // Example method
  async getDashboard(req: Request, res: Response, next: NextFunction) {

  }

  async getAllPayments(req: Request, res: Response, next: NextFunction) {

  }

  async getAllCommissions(req: Request, res: Response, next: NextFunction) {

  }

  async getAllPayouts(req: Request, res: Response, next: NextFunction) {

  }

  async processPayout(req: Request, res: Response, next: NextFunction) {

  }

  async processRefund(req: Request, res: Response, next: NextFunction) {

  }

}

export const adminController = new AdminController();
