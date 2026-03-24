import { asyncHandler } from '../response/responseHandler';
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ApiError';
export const PatientOnly = asyncHandler((req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ForbiddenError();
  }
  if (req.user.role !== 'patient') {
    throw new ForbiddenError();
  }
  next();
});
