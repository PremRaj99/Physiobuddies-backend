import { asyncHandler } from '../response/responseHandler';
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ApiError';
export const TherapistOnly = asyncHandler((req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ForbiddenError();
  }
  if (req.user.role !== 'therapist') {
    throw new ForbiddenError();
  }
  next();
});
