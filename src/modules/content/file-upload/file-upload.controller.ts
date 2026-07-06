import type { NextFunction, Request, Response } from 'express';
import { OkResponse } from '@/core/response/ApiResponse';
import { ValidationError } from '@/core/errors/ApiError';
import path from 'path';
import fs from 'fs';

class FileUploadController {
  async uploadSingle(req: Request, res: Response, _next: NextFunction) {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }
    // Return relative URL of the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    return new OkResponse({ url: fileUrl }).send(res);
  }

  async uploadMultiple(req: Request, res: Response, _next: NextFunction) {
    if (!req.files || !Array.isArray(req.files)) {
      throw new ValidationError('No files uploaded');
    }
    const files = req.files as Express.Multer.File[];
    const urls = files.map((file) => `/uploads/${file.filename}`);
    return new OkResponse({ urls }).send(res);
  }

  async deleteFile(req: Request, res: Response, _next: NextFunction) {
    const { filename } = req.params;
    if (!filename || typeof filename !== 'string') {
      throw new ValidationError('Invalid filename');
    }
    const filePath = path.join(__dirname, '../../../../uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return new OkResponse({ message: 'File deleted successfully' }).send(res);
    } else {
      throw new ValidationError('File not found');
    }
  }
}

export const fileUploadController = new FileUploadController();
export type FileUploadControllerType = typeof fileUploadController;
