import type { Request } from 'express';
import geoip from 'fast-geoip';

/**
 * Formats location string from IP lookup result.
 */
export const formatGeoLocation = async (ip?: string): Promise<string> => {
  if (!ip) return '';
  const geo = await geoip.lookup(ip);
  return geo ? `${geo.city}, ${geo.region}, ${geo.country}` : '';
};

/**
 * Constructs AuthSession database payload.
 */
export const buildAuthSessionPayload = async (
  userId: string,
  refreshToken: string,
  req: Request,
) => {
  const ip = req.ip || '';
  const agent = req.get('User-Agent') || '';
  const location = await formatGeoLocation(ip);
  const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    userId,
    refreshToken,
    ip,
    agent,
    expiredAt,
    location,
    lastLoggedAt: new Date(),
  };
};
