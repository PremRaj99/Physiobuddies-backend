import { asyncHandler } from '../response/responseHandler';
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ApiError';
export const AdminOnly = asyncHandler((req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ForbiddenError();
  }
  if (req.user.role !== 'admin') {
    throw new ForbiddenError();
  }
  next();
});
