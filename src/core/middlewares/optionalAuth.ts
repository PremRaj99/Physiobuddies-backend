import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET } from '../constants';
import { UnauthorizedError } from '../errors/ApiError';
import { asyncHandler } from '../response/responseHandler';
import { logger } from '../logger/logger';

export const optionalAuth = asyncHandler((req, _res, next) => {
  const header = req.cookies?.['access_token'] || req.headers.authorization;
  const token = header?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, String(ACCESS_TOKEN_SECRET)) as unknown as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid access token', { error });
    throw new UnauthorizedError();
  }
});
