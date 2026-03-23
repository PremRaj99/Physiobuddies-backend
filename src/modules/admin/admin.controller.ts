import type { NextFunction, Request, Response } from 'express';
import { adminService } from './admin.service';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '../identity/auth/auth.type';

class AdminController {
  // Example method
  async getDashboard(_req: Request, res: Response, _next: NextFunction) {
    const dashboardData = await adminService.getDashboardData();
    return new OkResponse(dashboardData).send(res);
  }

  async getAllPayments(_req: Request, res: Response, _next: NextFunction) {
    const payments = await adminService.getAllPayments();
    return new OkResponse(payments).send(res);
  }

  async getAllCommissions(_req: Request, res: Response, _next: NextFunction) {
    const commissions = await adminService.getAllCommissions();
    return new OkResponse(commissions).send(res);
  }

  async getAllPayouts(_req: Request, res: Response, _next: NextFunction) {
    const payouts = await adminService.getAllPayouts();
    return new OkResponse(payouts).send(res);
  }

  async processPayout(req: Request, res: Response, _next: NextFunction) {
    const payoutRequestId = validateSchema(ObjectIdSchema, req.params.id);
    await adminService.processPayout(payoutRequestId);
    return new AcceptedResponse('Payout processed successfully').send(res);
  }

  async processRefund(req: Request, res: Response, _next: NextFunction) {
    const sessionId = validateSchema(ObjectIdSchema, req.params.sessionId);
    await adminService.processRefund(sessionId);
    return new AcceptedResponse('Refund processed successfully').send(res);
  }
}

export const adminController = new AdminController();
