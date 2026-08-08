import 'dotenv/config';
import { vi } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { router } from '@/app';
import { errorHandlerMiddleware } from '@/core/errors/errorHandler';
import { requestContextMiddleware } from '@/core/logger/requestContextMiddleware';

// Mock Redis client
const redisStore = new Map<string, { value: string; expireAt?: number | undefined }>();

vi.mock('@/shared/redis', () => ({
  default: {
    get: vi.fn(async (key: string) => {
      const entry = redisStore.get(key);
      if (!entry) return null;
      if (entry.expireAt && Date.now() > entry.expireAt) {
        redisStore.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: vi.fn(
      async (
        key: string,
        value: string,
        modeOrOptions?: string | { EX?: number; PX?: number },
        duration?: number,
      ) => {
        let expireAt: number | undefined;
        if (typeof modeOrOptions === 'object' && modeOrOptions !== null) {
          if (typeof modeOrOptions.EX === 'number') {
            expireAt = Date.now() + modeOrOptions.EX * 1000;
          } else if (typeof modeOrOptions.PX === 'number') {
            expireAt = Date.now() + modeOrOptions.PX;
          }
        } else if (modeOrOptions === 'EX' && typeof duration === 'number') {
          expireAt = Date.now() + duration * 1000;
        }
        redisStore.set(key, { value, expireAt });
        return 'OK';
      },
    ),
    del: vi.fn(async (key: string) => {
      const deleted = redisStore.delete(key);
      return deleted ? 1 : 0;
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      const entry = redisStore.get(key);
      if (!entry) return 0;
      entry.expireAt = Date.now() + seconds * 1000;
      return 1;
    }),
  },
  initRedis: vi.fn(async () => {}),
  getRedisClient: vi.fn(() => ({})),
}));

// Mock Email Handler
vi.mock('@/shared/mailHandler', () => ({
  sendMail: vi.fn(async () => ({ success: true, messageId: 'mock-email-id' })),
}));

// Export helper to reset mock stores between test runs
export const resetRedisMock = () => redisStore.clear();
export const getRedisMockStore = () => redisStore;

// Factory for Supertest Express App
export const createTestApp = () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);
  return app;
};
