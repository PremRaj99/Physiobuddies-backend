import type { Request } from 'express';

/**
 * Extracts client IP address from request headers or socket.
 */
export const extractClientIp = (req?: Request, customIp?: string): string => {
  return (
    customIp ||
    (req?.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    '127.0.0.1'
  );
};

/**
 * Converts a data value to string representation.
 */
export const stringifyPayload = (val: unknown): string | null => {
  if (val === undefined || val === null) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
};
