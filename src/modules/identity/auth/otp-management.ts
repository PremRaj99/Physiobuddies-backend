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

export const checkOTP = async (email: string) => {
  const existingOTP = await redisClient.get(`otp:${email}`);
  return existingOTP;
};

export const checkRateLimits = async (email: string) => {
  const cooldownKey = `otp_cooldown:${email}`;
  const rateLimitKey = `otp_limit:${email}`;

  // CHECK 1: Is user in the "Cooldown" period? (e.g., just sent one 10s ago)
  const isInCooldown = await redisClient.get(cooldownKey);
  if (isInCooldown) {
    const ttl = await redisClient.ttl(cooldownKey);
    throw new ValidationError(`Please wait ${ttl} seconds before requesting a new code.`);
  }

  // CHECK 2: Has user exceeded max attempts per hour?
  const currentAttempts = await redisClient.get(rateLimitKey);
  if (currentAttempts && parseInt(currentAttempts) >= MAX_ATTEMPTS) {
    const ttl = await redisClient.ttl(rateLimitKey);
    const minutes = Math.ceil(ttl / 60);
    throw new ValidationError(`Too many attempts. Please try again in ${minutes} minutes.`);
  }
};

/**
 * Generates OTP and sets up all Redis counters
 */
export const createAndStoreOTP = async (email: string) => {
  const otp = generateOTP();

  const otpKey = `otp:${email}`;
  const cooldownKey = `otp_cooldown:${email}`;
  const rateLimitKey = `otp_limit:${email}`;

  // Transaction to ensure atomicity (all set or none)
  const multi = redisClient.multi();

  // 1. Store the actual OTP (Valid for 5 mins)
  multi.set(otpKey, otp, { EX: OTP_VALIDITY_WINDOW });

  // 2. Set the Cooldown block (Blocks for 60s)
  multi.set(cooldownKey, '1', { EX: RESEND_COOLDOWN });

  // 3. Increment the Rate Limit counter (Persists for 1 hour)
  // If key doesn't exist, INCR creates it with value 1.
  multi.incr(rateLimitKey);

  // Execute transaction
  await multi.exec();

  // 4. Ensure the Rate Limit key expires after 1 hour (Only needs to be done once)
  // We check ttl to avoid resetting the expiration on every request
  const ttl = await redisClient.ttl(rateLimitKey);
  if (ttl === -1) {
    await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW);
  }

  logger.info(`OTP generated for ${email}: ${otp}`);
  return otp;
};
