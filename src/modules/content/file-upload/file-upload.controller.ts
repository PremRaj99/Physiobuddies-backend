import type { NextFunction, Request, Response } from 'express';

class FileUploadController {
  async uploadSingle(req: Request, res: Response, next: NextFunction) {}

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {}

  async deleteFile(req: Request, res: Response, next: NextFunction) {}
}

export const fileUploadController = new FileUploadController();
