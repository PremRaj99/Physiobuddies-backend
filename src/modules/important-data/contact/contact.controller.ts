import type { NextFunction, Request, Response } from 'express';

class ContactController {
  async submitContactForm(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllContacts(_req: Request, _res: Response, _next: NextFunction) {}

  async getContactById(_req: Request, _res: Response, _next: NextFunction) {}

  async updateContactStatus(_req: Request, _res: Response, _next: NextFunction) {}
}

export const contactController = new ContactController();
