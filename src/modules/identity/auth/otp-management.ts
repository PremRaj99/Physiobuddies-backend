export const OTP_EXPIRATION_TIME = 5 * 60; // 5 minutes in seconds

import { logger } from '@/core/logger/logger';
import { redisClient } from '@/shared/redis';
import { generateOTP } from './generateOTP';
import { ValidationError } from '@/core/errors/ApiError';

// --- CONSTANTS ---
const OTP_VALIDITY_WINDOW = 300; // 5 minutes (OTP expiration)
const RESEND_COOLDOWN = 60; // 1 minute (Time before next retry)
const MAX_ATTEMPTS = 3; // Max OTPs allowed per hour
const RATE_LIMIT_WINDOW = 3600; // 1 hour

export const checkOTP = async (identifier: string, prefix = 'otp') => {
  const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;
  const existingOTP = await redisClient.get(`${cleanPrefix}:${identifier}`);
  return existingOTP;
};

export const checkRateLimits = async (identifier: string, prefix = 'otp') => {
  const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;
  const cooldownKey = `${cleanPrefix}_cooldown:${identifier}`;
  const rateLimitKey = `${cleanPrefix}_limit:${identifier}`;

  // CHECK 1: Is user in the "Cooldown" period? (e.g., just sent one 60s ago)
  const isInCooldown = await redisClient.get(cooldownKey);
  if (isInCooldown) {
    const ttl = await redisClient.ttl(cooldownKey);
    throw new ValidationError(`Please wait ${ttl} seconds before requesting a new code.`);
  }

  // CHECK 2: Has user exceeded max attempts per hour?
  const currentAttempts = await redisClient.get(rateLimitKey);
  if (currentAttempts && parseInt(currentAttempts, 10) >= MAX_ATTEMPTS) {
    const ttl = await redisClient.ttl(rateLimitKey);
    const minutes = Math.ceil(ttl / 60);
    throw new ValidationError(`Too many attempts. Please try again in ${minutes} minutes.`);
  }
};

/**
 * Generates OTP and sets up all Redis counters (validity, cooldown, rate limit)
 */
export const createAndStoreOTP = async (
  identifier: string,
  prefix = 'otp',
  validitySeconds = OTP_VALIDITY_WINDOW,
) => {
  const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;

  // Enforce anti-abuse rate limits (cooldown & max attempts per hour)
  await checkRateLimits(identifier, cleanPrefix);

  const otp = generateOTP();

  const otpKey = `${cleanPrefix}:${identifier}`;
  const cooldownKey = `${cleanPrefix}_cooldown:${identifier}`;
  const rateLimitKey = `${cleanPrefix}_limit:${identifier}`;

  // Transaction to ensure atomicity (all set or none)
  const multi = redisClient.multi();

  // 1. Store the actual OTP (Valid for 5 mins by default)
  multi.set(otpKey, otp, { EX: validitySeconds });

  // 2. Set the Cooldown block (Blocks for 60s)
  multi.set(cooldownKey, '1', { EX: RESEND_COOLDOWN });

  // 3. Increment the Rate Limit counter (Persists for 1 hour)
  multi.incr(rateLimitKey);

  // Execute transaction
  await multi.exec();

  // 4. Ensure the Rate Limit key expires after 1 hour
  const ttl = await redisClient.ttl(rateLimitKey);
  if (ttl === -1) {
    await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW);
  }

  logger.info(`OTP generated for ${identifier} (prefix: ${cleanPrefix}): ${otp}`);
  return otp;
};

/**
 * Verifies OTP against Redis and deletes it on success
 */
export const verifyOTP = async (identifier: string, token: string, prefix = 'otp') => {
  const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;
  const otpKey = `${cleanPrefix}:${identifier}`;
  const cachedOTP = await redisClient.get(otpKey);

  if (!cachedOTP) {
    throw new ValidationError('Invalid or expired OTP');
  }

  if (cachedOTP !== token) {
    throw new ValidationError('Invalid OTP. Please check and try again.');
  }

  // Clear OTP from Redis after verification to prevent reuse
  await redisClient.del(otpKey);
  return true;
};

/**
 * Manually clear OTP from Redis
 */
export const clearOTP = async (identifier: string, prefix = 'otp') => {
  const cleanPrefix = prefix.endsWith(':') ? prefix.slice(0, -1) : prefix;
  const otpKey = `${cleanPrefix}:${identifier}`;
  await redisClient.del(otpKey);
};
