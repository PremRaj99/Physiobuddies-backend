import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '../core/constants';
import { logger } from '../core/logger/logger';

export const redisClient = createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    tls: true, // Required for Upstash Redis
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        logger.error('Redis reconnection attempts exceeded');
        return new Error('Redis reconnection attempts exceeded');
      }
      return Math.min(retries * 50, 500);
    },
  },
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected successfully');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready to use');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

// Connect to Redis
const initRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
};

export { initRedis };

export default redisClient;
