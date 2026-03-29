import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
import { NODE_ENV } from '../constants';

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers['X-Request-Id'] as string;
  const requestId = incomingId || uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const childLogger = logger.child({ requestId });
  req.logger = childLogger;

  const start = Date.now();
  const routePath =
    req.baseUrl && req.route?.path ? `${req.baseUrl}${req.route.path}` : req.originalUrl;

  const ignorePaths = ['favicon', '.png', '.jpg', '.jpeg', '.svg', 'logs', '.css', '.js'];

  if (ignorePaths.some((path) => routePath.includes(path))) {
    return next();
  }

  // 🔹 Request log
  childLogger.info('Incoming request', {
    method: req.method,
    route: routePath,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.on('finish', () => {
    // 🔹 Response log
    const duration = Date.now() - start;

    childLogger.info('http_request', {
      method: req.method,
      route: routePath,
      url: req.originalUrl,
      status: res.statusCode,
      duration: duration,
      success: res.statusCode < 400,
    });

    if (NODE_ENV !== 'production') {
      consoleLog(req, res, duration);
    }
  });

  next();
};

const consoleLog = (req: Request, res: Response, duration: number) => {
  const reset = '\x1b[0m';
  const statusColor =
    res.statusCode >= 500
      ? '\x1b[31m' // Red for Server Errors
      : res.statusCode >= 400
        ? '\x1b[33m' // Yellow for Client Errors
        : '\x1b[32m'; // Green for Success (2xx/3xx)

  const methodColors = {
    GET: '\x1b[36m', // Cyan
    POST: '\x1b[32m', // Green
    PUT: '\x1b[33m', // Yellow
    DELETE: '\x1b[31m', // Red
    PATCH: '\x1b[35m', // Magenta
  };
  type METHOD = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Fallback to white if the method isn't in the list
  const methodColor = methodColors[req.method as METHOD] || '\x1b[37m';

  // Format: [GET] /api/v1/users - 200 (15ms)
  const loggingString = `${methodColor}[${req.method}]${reset} ${req.originalUrl} - ${statusColor}${res.statusCode}${reset} (${duration}ms)`;

  console.log(loggingString);
};
