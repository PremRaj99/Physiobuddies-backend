import type { NextFunction, Request, Response } from 'express';

class FileUploadController {
  async uploadSingle(_req: Request, _res: Response, _next: NextFunction) {}

  async uploadMultiple(_req: Request, _res: Response, _next: NextFunction) {}

  async deleteFile(_req: Request, _res: Response, _next: NextFunction) {}
}

export const fileUploadController = new FileUploadController();
