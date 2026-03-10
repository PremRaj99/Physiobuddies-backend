import type { NextFunction, Request, Response } from 'express';

class TherapistRegistrationController {
  async submitRegistration(req: Request, res: Response, next: NextFunction) {}

  async getAllRegistrations(req: Request, res: Response, next: NextFunction) {}

  async getRegistrationById(req: Request, res: Response, next: NextFunction) {}

  async updateRegistrationStatus(req: Request, res: Response, next: NextFunction) {}

  async approveRegistration(req: Request, res: Response, next: NextFunction) {}

  async rejectRegistration(req: Request, res: Response, next: NextFunction) {}
}

export const therapistRegistrationController = new TherapistRegistrationController();
