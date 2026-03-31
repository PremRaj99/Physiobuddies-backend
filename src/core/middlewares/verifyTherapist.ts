import { asyncHandler } from '../response/responseHandler';
import { ForbiddenError } from '../errors/ApiError';
export const TherapistOnly = asyncHandler((req, _res, next) => {
  if (!req.user) {
    throw new ForbiddenError();
  }
  if (req.user.role !== 'therapist') {
    throw new ForbiddenError();
  }
  next();
});
