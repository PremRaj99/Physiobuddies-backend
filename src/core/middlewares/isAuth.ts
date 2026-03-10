import { UnauthorizedError } from '../errors/ApiError';
import type { Request } from 'express';

export function isAuth(
  req: Request,
): asserts req is Request & { user: { id: string; role: string } } {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
}
