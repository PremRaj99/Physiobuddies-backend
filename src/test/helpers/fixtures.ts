import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET } from '@/core/constants';

// Standard 24-character hex MongoDB ObjectIds
export const MOCK_IDS = {
  PATIENT_USER_ID: '65f1a2b3c4d5e6f7a8b9c0d1',
  PATIENT_PROFILE_ID: '65f1a2b3c4d5e6f7a8b9c0d2',
  THERAPIST_USER_ID: '65f1a2b3c4d5e6f7a8b9c0d3',
  THERAPIST_PROFILE_ID: '65f1a2b3c4d5e6f7a8b9c0d4',
  ADMIN_USER_ID: '65f1a2b3c4d5e6f7a8b9c0d5',
  SLOT_ID: '65f1a2b3c4d5e6f7a8b9c0d6',
  RESERVATION_ID: '65f1a2b3c4d5e6f7a8b9c0d7',
  TREATMENT_PLAN_ID: '65f1a2b3c4d5e6f7a8b9c0d8',
  TREATMENT_SESSION_ID: '65f1a2b3c4d5e6f7a8b9c0d9',
  INVALID_ID: '123-invalid-id',
};

// Secret fallback for tests if env not set
const TEST_JWT_SECRET = ACCESS_TOKEN_SECRET || 'test_jwt_secret_key_123456789';

// Generate JWT authorization header/cookie values
export const createMockToken = (user: { id: string; role: 'patient' | 'therapist' | 'admin' }) => {
  return jwt.sign({ id: user.id, role: user.role }, TEST_JWT_SECRET, { expiresIn: '1h' });
};

export const MOCK_TOKENS = {
  PATIENT: createMockToken({ id: MOCK_IDS.PATIENT_USER_ID, role: 'patient' }),
  THERAPIST: createMockToken({ id: MOCK_IDS.THERAPIST_USER_ID, role: 'therapist' }),
  ADMIN: createMockToken({ id: MOCK_IDS.ADMIN_USER_ID, role: 'admin' }),
};

// Fixtures for test requests
export const MOCK_PAYLOADS = {
  SEARCH_THERAPIST: {
    specialty: 'Sports Rehabilitation',
    lat: 12.9716,
    lng: 77.5946,
    radius: 10,
  },
  HOLD_SLOT: {
    therapistId: MOCK_IDS.THERAPIST_PROFILE_ID,
    slotId: MOCK_IDS.SLOT_ID,
    date: '2026-08-10',
  },
  PATIENT_DETAIL: {
    fullName: 'John Doe',
    age: 30,
    gender: 'MALE',
    phone: '9876543210',
    emergencyContact: '9123456789',
    medicalHistory: 'Lower back pain post workout',
  },
  PATIENT_LOCATION: {
    addressLine: '123 Main Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  RAZORPAY_VERIFY: {
    razorpay_order_id: 'order_Nx123456789',
    razorpay_payment_id: 'pay_Nx987654321',
    razorpay_signature: 'mock_valid_hmac_signature_hash',
    reservationId: MOCK_IDS.RESERVATION_ID,
  },
  CLINICAL_ASSESSMENT: {
    chiefComplaint: 'Acute lumbar strain',
    physicalExamination: 'Reduced flex range of motion at L4-L5',
    rangeOfMotion: 'Forward bend limited to 45 deg',
    diagnosticImpression: 'L4-L5 Muscle Spasm',
    recommendedSessions: 6,
    treatmentGoals: ['Pain reduction', 'Postural correction'],
  },
  DOC_RECORD: {
    title: 'Lumbar Spine X-Ray',
    imageUrl: 'https://storage.physiobuddies.com/docs/xray-l4l5.jpg',
    description: 'Lateral view showing mild disc space narrowing',
  },
  IMPROVEMENT_RECORD: {
    painScale: 3,
    mobilityScore: 8,
    notes: 'Significant pain reduction after manual therapy session #2',
  },
  MUTUAL_REVIEW: {
    rating: 5,
    comment: 'Great treatment session, highly professional guidance!',
    categories: ['Punctuality', 'Technical Skill'],
  },
  MANUAL_PLAN_COMPLETION: {
    finalPainScale: 1,
    overallOutcome: 'Full functional recovery achieved',
    outcomeImageUrl: 'https://storage.physiobuddies.com/outcomes/final-posture.jpg',
  },
};
