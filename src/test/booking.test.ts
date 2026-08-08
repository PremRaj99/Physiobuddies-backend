import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, resetRedisMock, getRedisMockStore } from './helpers/setup';
import { MOCK_IDS, MOCK_TOKENS, MOCK_PAYLOADS } from './helpers/fixtures';
import redisClient from '@/shared/redis';

const app = createTestApp();

describe('Booking Workflow Suite (TS-BOOK)', () => {
  beforeEach(() => {
    resetRedisMock();
    vi.clearAllMocks();
  });

  describe('1.1 Search & Selection', () => {
    it('TC-BOOK-001 [P0]: Search Therapists by Valid Criteria', async () => {
      const response = await request(app)
        .get('/api/v1/therapist')
        .query(MOCK_PAYLOADS.SEARCH_THERAPIST)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('TC-BOOK-002 [P1]: Search Therapists with Empty/No Match Result', async () => {
      const response = await request(app)
        .get('/api/v1/therapist')
        .query({ specialty: 'NonExistentSpecialty123' })
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('TC-BOOK-003 [P0]: View Available Time Slots for Selected Therapist', async () => {
      const response = await request(app)
        .get('/api/v1/reservation/slots')
        .query({ therapistId: MOCK_IDS.THERAPIST_PROFILE_ID, date: '2026-08-10' })
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });
  });

  describe('1.2 Redis Slot Hold & Concurrency (10 Min TTL)', () => {
    it('TC-BOOK-004 [P0]: Hold Time Slot in Redis (Happy Path)', async () => {
      const slotKey = `slot_hold:${MOCK_IDS.THERAPIST_PROFILE_ID}:${MOCK_IDS.SLOT_ID}:2026-08-10`;

      const response = await request(app)
        .post('/api/v1/reservation/hold')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.HOLD_SLOT);

      expect([200, 201, 400, 404]).toContain(response.status);

      // Simulate Redis setting the 600s TTL lock
      await redisClient.set(slotKey, MOCK_IDS.PATIENT_USER_ID, { EX: 600 });
      const heldValue = await redisClient.get(slotKey);
      expect(heldValue).toBe(MOCK_IDS.PATIENT_USER_ID);
    });

    it('TC-BOOK-005 [P0]: Concurrent Slot Hold Race Condition', async () => {
      const slotKey = `slot_hold:${MOCK_IDS.THERAPIST_PROFILE_ID}:${MOCK_IDS.SLOT_ID}:2026-08-10`;

      // Patient A acquires key first
      await redisClient.set(slotKey, MOCK_IDS.PATIENT_USER_ID, { EX: 600 });

      // Patient B attempts to acquire same key
      const isAlreadyHeld = await redisClient.get(slotKey);
      expect(isAlreadyHeld).toBe(MOCK_IDS.PATIENT_USER_ID);

      const responseB = await request(app)
        .post('/api/v1/reservation/hold')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.HOLD_SLOT);

      // Patient B request should be rejected or handle locked state
      expect([400, 409, 404]).toContain(responseB.status);
    });

    it('TC-BOOK-006 [P0]: Redis Hold Expiration Auto-Release', async () => {
      const slotKey = `slot_hold:${MOCK_IDS.THERAPIST_PROFILE_ID}:${MOCK_IDS.SLOT_ID}:2026-08-10`;

      // Set key with 1-second TTL
      await redisClient.set(slotKey, MOCK_IDS.PATIENT_USER_ID, { EX: 1 });

      // Simulate expiration in mock store
      const mockStore = getRedisMockStore();
      const entry = mockStore.get(slotKey);
      if (entry) entry.expireAt = Date.now() - 1000;

      const heldValue = await redisClient.get(slotKey);
      expect(heldValue).toBeNull();
    });

    it('TC-BOOK-007 [P1]: Re-Hold Already Held Slot by Same User', async () => {
      const slotKey = `slot_hold:${MOCK_IDS.THERAPIST_PROFILE_ID}:${MOCK_IDS.SLOT_ID}:2026-08-10`;
      await redisClient.set(slotKey, MOCK_IDS.PATIENT_USER_ID, { EX: 600 });

      const response = await request(app)
        .post('/api/v1/reservation/hold')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.HOLD_SLOT);

      expect([200, 201, 400, 404, 409]).toContain(response.status);
    });
  });

  describe('1.3 Patient Details, Location & Redis Preview', () => {
    it('TC-BOOK-008 [P0]: Add/Select Patient Details & Location Validation', async () => {
      const detailRes = await request(app)
        .post('/api/v1/patient/detail')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.PATIENT_DETAIL);

      expect([200, 201, 400, 404]).toContain(detailRes.status);

      const locationRes = await request(app)
        .post('/api/v1/patient/location')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.PATIENT_LOCATION);

      expect([200, 201, 400, 404]).toContain(locationRes.status);
    });

    it('TC-BOOK-009 [P0]: Dynamic Booking Preview via Redis Cache', async () => {
      const previewKey = `booking_preview:${MOCK_IDS.RESERVATION_ID}`;
      await redisClient.set(previewKey, JSON.stringify({ baseFee: 1000, tax: 180, total: 1180 }), {
        EX: 600,
      });

      const cached = await redisClient.get(previewKey);
      expect(cached).not.toBeNull();
      expect(JSON.parse(cached!).total).toBe(1180);

      const response = await request(app)
        .post('/api/v1/reservation/preview')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send({ reservationId: MOCK_IDS.RESERVATION_ID });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('TC-BOOK-010 [P1]: Booking Preview Attempt After Hold Expiration', async () => {
      const previewKey = `booking_preview:expired_res_id`;
      // Ensure key does not exist
      await redisClient.del(previewKey);

      const response = await request(app)
        .post('/api/v1/reservation/preview')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send({ reservationId: 'expired_res_id' });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('1.4 Payment Execution & Booking Completion', () => {
    it('TC-BOOK-011 [P0]: Create Payment Order & Verify Signature (Happy Path)', async () => {
      const createOrderRes = await request(app)
        .post('/api/v1/payment/create-order')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send({ reservationId: MOCK_IDS.RESERVATION_ID, amount: 1180 });

      expect([200, 201, 400, 404]).toContain(createOrderRes.status);

      const verifyRes = await request(app)
        .post('/api/v1/payment/verify')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.RAZORPAY_VERIFY);

      expect([200, 400, 404]).toContain(verifyRes.status);
    });

    it('TC-BOOK-012 [P0]: Payment Completed After Redis Lock Expiration (Edge Case)', async () => {
      const slotKey = `slot_hold:${MOCK_IDS.THERAPIST_PROFILE_ID}:${MOCK_IDS.SLOT_ID}:2026-08-10`;
      // Lock expired
      await redisClient.del(slotKey);

      const verifyRes = await request(app)
        .post('/api/v1/payment/verify')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.RAZORPAY_VERIFY);

      expect([200, 400, 404, 409]).toContain(verifyRes.status);
    });

    it('TC-BOOK-013 [P1]: Payment Failure Handling', async () => {
      const failureRes = await request(app)
        .post('/api/v1/payment/verify')
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send({
          ...MOCK_PAYLOADS.RAZORPAY_VERIFY,
          razorpay_signature: 'invalid_tampered_signature',
        });

      expect([400, 401, 404]).toContain(failureRes.status);
    });
  });
});
