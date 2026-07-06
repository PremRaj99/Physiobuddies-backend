import { Router } from 'express';
import { fileUploadController } from './file-upload.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export const fileUploadRouter = Router();

fileUploadRouter.use(verifyJWT);

fileUploadRouter.post('/single', upload.single('file'), fileUploadController.uploadSingle);
fileUploadRouter.post('/multiple', upload.array('files', 10), fileUploadController.uploadMultiple);
fileUploadRouter.delete('/:filename', fileUploadController.deleteFile);
