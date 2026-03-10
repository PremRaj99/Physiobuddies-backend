import { logger } from '@/core/logger/logger';
import { createClient } from 'redis';

export const redisClient = createClient({
  username: 'default',
  password: 'FI4jBXOnE49aJi4JurSEyYO9CoIqFz0P',
  socket: {
    host: 'redis-16737.crce179.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 16737,
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

redisClient.connect().catch(logger.error);

export default redisClient;
