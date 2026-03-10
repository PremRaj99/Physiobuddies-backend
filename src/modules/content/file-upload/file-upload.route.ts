import { Router } from 'express';
import { fileUploadController } from './file-upload.controller';

export const fileUploadRouter = Router();

// Note: Add multer middleware before these routes
fileUploadRouter.post('/single', fileUploadController.uploadSingle);
fileUploadRouter.post('/multiple', fileUploadController.uploadMultiple);
fileUploadRouter.delete('/:filename', fileUploadController.deleteFile);
