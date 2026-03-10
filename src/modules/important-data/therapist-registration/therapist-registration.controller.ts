import type { NextFunction, Request, Response } from 'express';

class TherapistRegistrationController {
  async submitRegistration(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllRegistrations(_req: Request, _res: Response, _next: NextFunction) {}

  async getRegistrationById(_req: Request, _res: Response, _next: NextFunction) {}

  async updateRegistrationStatus(_req: Request, _res: Response, _next: NextFunction) {}

  async approveRegistration(_req: Request, _res: Response, _next: NextFunction) {}

  async rejectRegistration(_req: Request, _res: Response, _next: NextFunction) {}
}

export const therapistRegistrationController = new TherapistRegistrationController();
