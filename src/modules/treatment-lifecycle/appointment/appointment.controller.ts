import type { NextFunction, Request, Response } from 'express';

class AppointmentController {
  async createAppointment(req: Request, res: Response, next: NextFunction) {}
  
  async listAppointments(req: Request, res: Response, next: NextFunction) {}
  
  async getAppointmentById(req: Request, res: Response, next: NextFunction) {}

  async cancelAppointment(req: Request, res: Response, next: NextFunction) {}
}

export const appointmentController = new AppointmentController();
