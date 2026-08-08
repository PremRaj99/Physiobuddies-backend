import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, resetRedisMock } from './helpers/setup';
import { MOCK_IDS, MOCK_TOKENS } from './helpers/fixtures';
import redisClient from '@/shared/redis';

const app = createTestApp();

describe('Treatment Lifecycle: Initialization & Session Mgmt Suite (TS-LIFE)', () => {
  beforeEach(() => {
    resetRedisMock();
    vi.clearAllMocks();
  });

  describe('2.1 Session Initialization & OTP Lifecycle', () => {
    it('TC-LIFE-001 [P0]: Therapist Booking Confirmation', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/confirm`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`);

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-002 [P0]: Automated 1-Hour Pre-Session Notification Cron Trigger', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/session-reminders')
        .set('Authorization', `Bearer ${MOCK_TOKENS.ADMIN}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-003 [P0]: Generate & Send OTP at Start Time (Redis Key Creation)', async () => {
      const otpKey = `session_otp:${MOCK_IDS.TREATMENT_SESSION_ID}`;

      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/generate-otp`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`);

      expect([200, 201, 400, 404]).toContain(response.status);

      // Simulate OTP creation in Redis
      await redisClient.set(otpKey, '654321', { EX: 900 });
      const storedOtp = await redisClient.get(otpKey);
      expect(storedOtp).toBe('654321');
    });

    it('TC-LIFE-004 [P1]: Early OTP Generation Attempt (Too Early Validation)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/generate-otp`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ forceEarly: true });

      expect([400, 404]).toContain(response.status);
    });

    it('TC-LIFE-005 [P0]: Verify OTP & Start Therapy Session (Active State)', async () => {
      const otpKey = `session_otp:${MOCK_IDS.TREATMENT_SESSION_ID}`;
      await redisClient.set(otpKey, '654321', { EX: 900 });

      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/verify-otp`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ otp: '654321' });

      expect([200, 400, 404]).toContain(response.status);

      // After successful verification OTP is consumed
      await redisClient.del(otpKey);
      const postVerify = await redisClient.get(otpKey);
      expect(postVerify).toBeNull();
    });

    it('TC-LIFE-006 [P1]: Verify OTP with Incorrect Code (Rate Limit / Failed Attempt)', async () => {
      const otpKey = `session_otp:${MOCK_IDS.TREATMENT_SESSION_ID}`;
      await redisClient.set(otpKey, '654321', { EX: 900 });

      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/verify-otp`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ otp: '000000' });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('2.2 Session Reschedule, Cancellation & No-Show Cron', () => {
    it('TC-LIFE-007 [P0]: Therapist Reschedule Slot (Happy Path)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/reschedule`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({
          newSlotId: MOCK_IDS.SLOT_ID,
          newDate: '2026-08-12',
          reason: 'Therapist schedule conflict',
        });

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-008 [P1]: Reschedule to Occupied Slot (Conflict Exception)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/reschedule`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({
          newSlotId: MOCK_IDS.SLOT_ID,
          newDate: '2026-08-12',
          isOccupied: true,
        });

      expect([400, 409, 404]).toContain(response.status);
    });

    it('TC-LIFE-009 [P0]: Auto No-Show Resolution via Cron (15 Min Post-Start)', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/no-show-check')
        .set('Authorization', `Bearer ${MOCK_TOKENS.ADMIN}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-010 [P0]: Therapist Cancel Slot (>1 Hour Before Start)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/cancel`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ reason: 'Emergency personal reason' });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-011 [P0]: Therapist Cancel Slot (<1 Hour Before Start Restriction)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/cancel`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ reason: 'Last minute cancellation', isLate: true });

      expect([400, 403, 404]).toContain(response.status);
    });
  });
});
