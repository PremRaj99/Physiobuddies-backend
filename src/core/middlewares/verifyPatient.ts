import { asyncHandler } from '../response/responseHandler';
import { ForbiddenError } from '../errors/ApiError';
export const PatientOnly = asyncHandler((req, _res, next) => {
  if (!req.user) {
    throw new ForbiddenError();
  }
  if (req.user.role !== 'patient') {
    throw new ForbiddenError();
  }
  next();
});
