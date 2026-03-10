import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: Request) => (req.user ? 100000 : 10000),
  message: { error: 'Too Many Requests, please try again later!' },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || 'unknown'),
});
