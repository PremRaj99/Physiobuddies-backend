import type { NextFunction, Request, Response } from 'express';

class AppointmentController {
  async createTreatmentPlan(_req: Request, _res: Response, _next: NextFunction) {}

  async listTreatmentPlans(_req: Request, _res: Response, _next: NextFunction) {}

  async getTreatmentPlanById(_req: Request, _res: Response, _next: NextFunction) {}

  async cancelTreatmentPlan(_req: Request, _res: Response, _next: NextFunction) {}
}

export const appointmentController = new AppointmentController();
