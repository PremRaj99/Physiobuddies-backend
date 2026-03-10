import type { NextFunction, Request, Response } from 'express';

class AppointmentController {
  async createAppointment(_req: Request, _res: Response, _next: NextFunction) {}

  async listAppointments(_req: Request, _res: Response, _next: NextFunction) {}

  async getAppointmentById(_req: Request, _res: Response, _next: NextFunction) {}

  async cancelAppointment(_req: Request, _res: Response, _next: NextFunction) {}
}

export const appointmentController = new AppointmentController();
