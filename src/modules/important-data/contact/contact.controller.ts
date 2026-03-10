import type { NextFunction, Request, Response } from 'express';

class ContactController {
  async submitContactForm(req: Request, res: Response, next: NextFunction) {}

  async getAllContacts(req: Request, res: Response, next: NextFunction) {}

  async getContactById(req: Request, res: Response, next: NextFunction) {}

  async updateContactStatus(req: Request, res: Response, next: NextFunction) {}
}

export const contactController = new ContactController();
