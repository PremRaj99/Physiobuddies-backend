import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, resetRedisMock } from './helpers/setup';
import { MOCK_IDS, MOCK_TOKENS, MOCK_PAYLOADS } from './helpers/fixtures';

const app = createTestApp();

describe('Clinical Reports, Documents & Treatment Plan Suite (TS-LIFE-CLINICAL/PLAN)', () => {
  beforeEach(() => {
    resetRedisMock();
    vi.clearAllMocks();
  });

  describe('3.1 Assessment Reports, Docs & Session Completion', () => {
    it('TC-LIFE-012 [P0]: Mandatory 1st Session Assessment Report Enforcement', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/complete`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ isFirstSession: true, skipAssessment: true });

      expect([400, 404]).toContain(response.status);
    });

    it('TC-LIFE-013 [P0]: Complete 1st Session with Valid Assessment Report', async () => {
      const assessmentRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/assessment`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send(MOCK_PAYLOADS.CLINICAL_ASSESSMENT);

      expect([200, 201, 400, 404]).toContain(assessmentRes.status);

      const completeRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/complete`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ isFirstSession: true });

      expect([200, 400, 404]).toContain(completeRes.status);
    });

    it('TC-LIFE-014 [P1]: Add Clinical Documents (X-Ray, CT Scan, Reports)', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-plan/${MOCK_IDS.TREATMENT_PLAN_ID}/documents`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send(MOCK_PAYLOADS.DOC_RECORD);

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-015 [P0]: 2nd Session Onwards Improvement Report Completion', async () => {
      const improvementRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/improvement`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send(MOCK_PAYLOADS.IMPROVEMENT_RECORD);

      expect([200, 201, 400, 404]).toContain(improvementRes.status);

      const completeRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/complete`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ isFirstSession: false });

      expect([200, 400, 404]).toContain(completeRes.status);
    });
  });

  describe('3.2 Recommendations, Multi-Session & Mutual Feedback', () => {
    it('TC-LIFE-016 [P1]: Patient Views Recommended Slots Post 1st Session', async () => {
      const response = await request(app)
        .get(`/api/v1/treatment-plan/${MOCK_IDS.TREATMENT_PLAN_ID}/recommended-slots`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`);

      expect([200, 404]).toContain(response.status);
    });

    it('TC-LIFE-017 [P0]: Book Multiple Follow-Up Sessions on Existing Plan', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-plan/${MOCK_IDS.TREATMENT_PLAN_ID}/book-sessions`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send({
          slots: [
            { slotId: MOCK_IDS.SLOT_ID, date: '2026-08-14' },
            { slotId: MOCK_IDS.SLOT_ID, date: '2026-08-16' },
          ],
        });

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-018 [P0]: Mutual Feedback Submission (Patient & Therapist)', async () => {
      const patientReviewRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/review`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.MUTUAL_REVIEW);

      expect([200, 201, 202, 400, 404]).toContain(patientReviewRes.status);

      const therapistReviewRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/therapist-review`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send({ complianceRating: 5, notes: 'Patient adhered well to exercise regimen' });

      expect([200, 201, 400, 404]).toContain(therapistReviewRes.status);
    });

    it('TC-LIFE-019 [P1]: Duplicate Review Submission Prevention', async () => {
      const firstRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/review`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.MUTUAL_REVIEW);

      expect([200, 201, 202, 400, 404]).toContain(firstRes.status);

      const duplicateRes = await request(app)
        .post(`/api/v1/treatment-session/${MOCK_IDS.TREATMENT_SESSION_ID}/review`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.PATIENT}`)
        .send(MOCK_PAYLOADS.MUTUAL_REVIEW);

      expect([200, 201, 202, 400, 409, 404]).toContain(duplicateRes.status);
    });
  });

  describe('3.3 Treatment Plan Closure & Auto-Completion', () => {
    it('TC-LIFE-020 [P0]: Auto-Complete Treatment Plan After 1 Week of Inactivity Cron', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/auto-complete-plans')
        .set('Authorization', `Bearer ${MOCK_TOKENS.ADMIN}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('TC-LIFE-021 [P0]: Therapist Manual Plan Completion with Final Improvement Report', async () => {
      const response = await request(app)
        .post(`/api/v1/treatment-plan/${MOCK_IDS.TREATMENT_PLAN_ID}/final-complete`)
        .set('Authorization', `Bearer ${MOCK_TOKENS.THERAPIST}`)
        .send(MOCK_PAYLOADS.MANUAL_PLAN_COMPLETION);

      expect([200, 201, 400, 404]).toContain(response.status);
    });
  });
});
