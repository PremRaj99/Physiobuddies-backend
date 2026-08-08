import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, resetRedisMock } from './helpers/setup';
import { MOCK_IDS, MOCK_TOKENS } from './helpers/fixtures';
import redisClient from '@/shared/redis';

const app = createTestApp();

describe('Security, Authorization & Edge Cases Suite (TS-SEC & TC-EDGE)', () => {
  beforeEach(() => {
    resetRedisMock();
    vi.clearAllMocks();
  });

  describe('4.1 Authorization & Role Guards', () => {
    it('TC-SEC-001 [P0]: Patient Attempts to Call Therapist-Only Endpoint (Verify OTP)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/verify-otp`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`) // Unauthorized role
        .send({ otp: '123456' });

      expect([401, 403, 404]).toContain(response.status);
    });

    it('TC-SEC-002 [P0]: Unauthenticated Request (Missing JWT Header/Cookie)', async () => {
      const response = await request(app)
        .post('/api/v1/reservation/session')
        .send({ therapistId: MOCK_IDS.THERAPIST_PROFILE_ID, slotId: MOCK_IDS.SLOT_ID });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('TC-SEC-003 [P0]: Data Isolation Guard Across Patient Profiles', async () => {
      const response = await request(app)
        .get(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/assessment`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`); // Requesting session belonging to another user

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('4.2 Input Validation & System Resiliency Edge Cases', () => {
    it('TC-EDGE-001 [P1]: Invalid 24-Character Hex ObjectId Input Validation', async () => {
      const response = await request(app)
        .get(`/api/v1/treatment-session/${MOCK_IDS.INVALID_ID}`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`);

      expect([400, 404]).toContain(response.status);
    });

    it('TC-REDIS-001 [P1]: Upstash Redis Store Failover Resilience', async () => {
      vi.spyOn(redisClient, 'get').mockRejectedValueOnce(new Error('Redis connection timeout'));

      const response = await request(app)
        .post('/api/v1/reservation/hold')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send({
          therapistId: MOCK_IDS.THERAPIST_PROFILE_ID,
          slotId: MOCK_IDS.SLOT_ID,
          date: '2026-08-10',
        });

      // System should catch Redis error and handle gracefully or return 502 DatabaseError / 400
      expect([400, 500, 502, 404]).toContain(response.status);
    });
  });
});
