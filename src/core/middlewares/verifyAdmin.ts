import { asyncHandler } from '../response/responseHandler';
import { ForbiddenError } from '../errors/ApiError';
export const AdminOnly = asyncHandler((req, _res, next) => {
  if (!req.user) {
    throw new ForbiddenError();
  }
  if (req.user.role !== 'admin') {
    throw new ForbiddenError();
  }
  next();
});
