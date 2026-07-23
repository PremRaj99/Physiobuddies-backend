import { logActivity } from '@/modules/log/activity/activity.service';
import type { NextFunction, Request, Response } from 'express';

const SENSITIVE_KEYS = [
  'password',
  'newpassword',
  'oldpassword',
  'token',
  'secret',
  'creditcard',
  'cvv',
  'authorization',
  'pass',
];

function sanitizeData(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.length > 500) {
      return obj.substring(0, 500) + '... [TRUNCATED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeData(val);
    } else if (typeof val === 'string' && val.length > 500) {
      clean[key] = val.substring(0, 500) + '... [TRUNCATED]';
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

const isNonEmptyObject = (val: unknown): boolean =>
  !!val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0;

export function activityLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();

  // Only log state-modifying operations (POST, PUT, PATCH, DELETE)
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  res.on('finish', () => {
    try {
      // Only record log for successful operations when a user context is available
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.id) {
        const fullPath = req.originalUrl || `${req.baseUrl}${req.path}`;
        const routePath = fullPath.replace('/api/v1', '');
        const actionTitle = `${method} ${routePath}`;

        let type: 'frequent' | 'likely' | 'possible' | 'rare' | 'unlikely' = 'frequent';
        if (method === 'DELETE') {
          type = 'rare';
        } else if (method === 'PUT' || method === 'PATCH') {
          type = 'possible';
        } else if (method === 'POST') {
          type = 'likely';
        }

        const bodyData = sanitizeData(req.body);
        const queryData = sanitizeData(req.query);

        const payloadSummary = {
          method,
          path: routePath,
          query: isNonEmptyObject(queryData) ? queryData : undefined,
          body: isNonEmptyObject(bodyData) ? bodyData : undefined,
          status: res.statusCode,
        };

        logActivity({
          userId: req.user.id,
          title: actionTitle,
          data: payloadSummary,
          type,
          req,
        }).catch((err) => {
          req.logger.error('Error recording automatic activity log:', err);
        });
      }
    } catch (error) {
      req.logger.error('Error recording automatic activity log:', error);
    }
  });

  next();
}
