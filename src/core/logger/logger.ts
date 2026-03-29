import winston from 'winston';
import { LOG_LEVEL } from '../constants';

export const logger = winston.createLogger({
  level: LOG_LEVEL || 'info',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      return JSON.stringify({
        level,
        message,
        timestamp,
        ...meta,
      });
    }),
  ),

  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
