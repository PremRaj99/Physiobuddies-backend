# Test Cases Suite: PhysioBuddies Booking & Treatment Lifecycle

This document provides a comprehensive test suite for the feature workflow outlined in [plan.txt](file:///c:/Users/premr/OneDrive/Documents/PhysioBuddies/api2/prisma/plan.txt).

---

## 📋 Overview & Test Execution Matrix

| Test Suite ID | Domain / Feature Module | Total Cases | P0 (Critical) | P1 (High) | P2 (Medium) |
|---|---|---|---|---|---|
| **TS-BOOK** | Booking Workflow (Search to Payment & Booking Complete) | 18 | 9 | 6 | 3 |
| **TS-LIFE-START** | Session Initialization & OTP Lifecycle | 12 | 7 | 4 | 1 |
| **TS-LIFE-MGMT** | Session Reschedule, Cancellation & No-Show Cron | 10 | 5 | 4 | 1 |
| **TS-LIFE-CLINICAL** | Assessment Reports, Docs & Session Completion | 12 | 6 | 4 | 2 |
| **TS-LIFE-PLAN** | Recommendations, Multi-Session & Mutual Feedback | 10 | 4 | 4 | 2 |
| **TS-LIFE-CLOSE** | Plan Auto-Completion & Final Therapist Closure | 6 | 3 | 2 | 1 |
| **TOTAL** | **6 Modules** | **68 Cases** | **34** | **24** | **10** |

---

## 1. Booking Workflow (`TS-BOOK`)

### 1.1 Search & Selection

#### `TC-BOOK-001` [P0] - Search Therapists by Valid Criteria
- **Description**: Verify patient can search therapists using filters (specialty, location radius, price, rating).
- **Preconditions**: Patient is authenticated; therapist profiles exist with geo-coordinates and specialties.
- **Steps**:
  1. Send `GET /api/v1/therapist/search` with parameters `specialty=Sports`, `lat=12.97`, `lng=77.59`, `radius=10km`.
- **Expected Outcome**: Returns HTTP 200 with list of matching active therapists, including distance and available date range. Excludes soft-deleted/inactive therapists.

#### `TC-BOOK-002` [P1] - Search Therapists with Empty/No Match Result
- **Description**: Search with criteria matching no registered therapist.
- **Steps**: Send `GET /api/v1/therapist/search` with non-existent specialty or remote location.
- **Expected Outcome**: Returns HTTP 200 with empty data array `[]` and pagination metadata.

#### `TC-BOOK-003` [P0] - View Available Time Slots for Selected Therapist
- **Description**: Verify availability calendar fetches unreserved, active slots for a therapist on a given date.
- **Steps**: Send `GET /api/v1/reservation/slots?therapistId={id}&date=2026-08-10`.
- **Expected Outcome**: Returns HTTP 200 with array of open time slots. Excludes already locked/booked slots.

---

### 1.2 Redis Slot Hold & Concurrency (10 Min TTL)

#### `TC-BOOK-004` [P0] - Hold Time Slot in Redis (Happy Path)
- **Description**: Patient selects an open slot; system locks it in Redis for 10 minutes (600 seconds).
- **Steps**: Send `POST /api/v1/reservation/hold` with `{ therapistId, slotId, date }`.
- **Expected Outcome**:
  1. Returns HTTP 200 with `reservationId` and `expiresAt` timestamp (now + 10 mins).
  2. Redis key `slot_hold:{therapistId}:{slotId}:{date}` created with TTL = 600 seconds.
  3. Slot status marked as `HELD` in real-time response to other users.

#### `TC-BOOK-005` [P0] - Concurrent Slot Hold Race Condition
- **Description**: Two patients attempt to hold the exact same slot at the identical millisecond.
- **Steps**: Dispatch concurrent HTTP requests from Patient A and Patient B for the same `{ therapistId, slotId, date }`.
- **Expected Outcome**:
  1. Patient A receives HTTP 200 with successful lock.
  2. Patient B receives HTTP 409 Conflict / `ValidationError` with message *"Slot is currently on hold by another user"*.
  3. Only 1 Redis key is held.

#### `TC-BOOK-006` [P0] - Redis Hold Expiration Auto-Release
- **Description**: Slot is held but patient takes no action for >10 minutes.
- **Steps**:
  1. Lock slot via `TC-BOOK-004`.
  2. Wait for 600 seconds or simulate Redis TTL expiration (`EXPIRE`).
  3. Query `GET /api/v1/reservation/slots` for that therapist.
- **Expected Outcome**: Slot automatically becomes available again for all patients. Redis key no longer exists.

#### `TC-BOOK-007` [P1] - Re-Hold Already Held Slot by Same User
- **Description**: Patient refreshes or re-submits hold before 10-minute expiry.
- **Steps**: Send hold request with same session/token for existing held slot.
- **Expected Outcome**: System extends TTL or returns existing reservation without error.

---

### 1.3 Patient Details, Location & Redis Preview

#### `TC-BOOK-008` [P0] - Add/Select Patient Details & Location
- **Description**: Patient fills/selects patient profile & emergency contact and delivery/session location.
- **Steps**: `POST /api/v1/patient/detail` and `POST /api/v1/patient/location` with valid schemas.
- **Expected Outcome**: Records created/linked to patient ID; invalid MongoDB ObjectIds or missing required Zod schema fields trigger HTTP 400 `ValidationError`.

#### `TC-BOOK-009` [P0] - Dynamic Booking Preview via Redis
- **Description**: Generate order preview including fee breakdown, dynamic pricing, and applied coupons stored in Redis session.
- **Steps**: Send `POST /api/v1/reservation/preview` with `reservationId`, `couponCode` (optional).
- **Expected Outcome**:
  1. Returns HTTP 200 with breakdown: Base Fee, Taxes, Platform Fee, Discount Amount, Final Payable.
  2. Preview state saved in Redis under `booking_preview:{reservationId}` with remaining TTL matching slot hold time.

#### `TC-BOOK-010` [P1] - Booking Preview Attempt After Hold Expiration
- **Description**: Patient attempts preview after the 10-minute hold window expires.
- **Steps**: Wait >10 minutes after hold, then request `/preview`.
- **Expected Outcome**: Returns HTTP 400 / 404 `ValidationError`: *"Reservation session has expired. Please re-select a slot."*

---

### 1.4 Payment Execution & Booking Completion

#### `TC-BOOK-011` [P0] - Create Payment Order & Verify Signature (Happy Path)
- **Description**: Complete payment via Razorpay integration within 10-minute hold window.
- **Steps**:
  1. Call `POST /api/v1/payment/create-order` for active `reservationId`.
  2. Simulate successful Razorpay checkout payment.
  3. Send `POST /api/v1/payment/verify` with `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
- **Expected Outcome**:
  1. Razorpay HMAC signature verified successfully.
  2. Payment record created in MongoDB with status `SUCCESS`.
  3. TreatmentPlan and initial TreatmentSession created.
  4. Redis hold key deleted.
  5. Notifications triggered to Patient & Therapist.

#### `TC-BOOK-012` [P0] - Payment Completed After Redis Lock Expiration (Edge Case)
- **Description**: Payment completes on gateway, but local Redis 10-min hold expired 5 seconds prior.
- **Steps**: Delay Razorpay callback until Redis lock key expires, then trigger webhook/verify.
- **Expected Outcome**:
  1. System detects slot was re-booked: Marks payment as `NEEDS_REFUND` or auto-creates compensation ticket/wallet balance.
  2. If slot is still free: Gracefully completes booking and converts hold to confirmed session.

#### `TC-BOOK-013` [P1] - Payment Failure Handling
- **Description**: Payment fails or user closes Razorpay modal.
- **Steps**: Razorpay payment failure callback triggered or order remains unpaid.
- **Expected Outcome**: Payment status logged as `FAILED`. Slot remains locked until 10-min TTL expires or user explicitly cancels hold.

---

## 2. Treatment Lifecycle: Session Initialization & OTP (`TS-LIFE-START`)

#### `TC-LIFE-001` [P0] - Therapist Booking Confirmation
- **Description**: Therapist views pending session and accepts it.
- **Steps**: `POST /api/v1/treatment-session/{sessionId}/confirm` by authenticated Therapist.
- **Expected Outcome**: `TreatmentSession` status changes to `CONFIRMED`. `StatusLog` entry appended.

#### `TC-LIFE-002` [P0] - Automated 1-Hour Pre-Session Notification
- **Description**: Cron background job scans for sessions starting in 60 minutes and dispatches notifications.
- **Steps**: Run `sessionScheduler` cron job when a session is scheduled at `currentTime + 60 minutes`.
- **Expected Outcome**:
  1. Push notification/SMS dispatched to Therapist and Patient.
  2. Notification logged in system audit log; job is idempotent (won't notify twice).

#### `TC-LIFE-003` [P0] - Generate & Send OTP at Start Time (Redis)
- **Description**: Therapist triggers OTP generation near session start time (e.g. within -15 to +15 minutes).
- **Steps**: `POST /api/v1/treatment-session/{sessionId}/generate-otp` by Therapist.
- **Expected Outcome**:
  1. 6-digit OTP generated and stored in Redis key `session_otp:{sessionId}` with 15-minute TTL.
  2. OTP sent to Patient's registered phone/email.
  3. Returns HTTP 200 with masked contact info.

#### `TC-LIFE-004` [P1] - Early OTP Generation Attempt (Too Early)
- **Description**: Therapist attempts OTP generation 2 hours before session start.
- **Steps**: Call `/generate-otp` >30 minutes prior to scheduled start time.
- **Expected Outcome**: HTTP 400 `ValidationError`: *"OTP can only be generated within 15 minutes of session start time."*

#### `TC-LIFE-005` [P0] - Verify OTP & Start Session (Active)
- **Description**: Therapist enters valid OTP provided by patient to commence treatment.
- **Steps**: `POST /api/v1/treatment-session/{sessionId}/verify-otp` with `{ otp: "123456" }`.
- **Expected Outcome**:
  1. OTP validated against Redis key.
  2. Redis OTP key deleted upon successful verification.
  3. Session status transitions from `CONFIRMED` -> `ACTIVE` / `IN_PROGRESS`.
  4. `actualStartTime` recorded in DB.

#### `TC-LIFE-006` [P1] - Verify OTP with Incorrect Code
- **Description**: Therapist enters wrong OTP 3 times.
- **Steps**: Submit invalid OTP code 3 consecutive times.
- **Expected Outcome**:
  1. HTTP 400 `ValidationError`: *"Invalid OTP. 2 attempts remaining."*
  2. After 3 failed attempts, Redis rate limit triggers cooldown; requires regenerating new OTP.

---

## 3. Session Reschedule, Cancellation & No-Show Cron (`TS-LIFE-MGMT`)

#### `TC-LIFE-007` [P0] - Therapist Reschedule Slot (Happy Path)
- **Description**: Therapist reschedules session to a future available slot.
- **Steps**: `POST /api/v1/treatment-session/{sessionId}/reschedule` with `{ newSlotId, newDate }`.
- **Expected Outcome**:
  1. Validates new slot is open.
  2. Session time updated; original slot freed.
  3. Reschedule log recorded in `RescheduleLog`.
  4. Notification sent to Patient.

#### `TC-LIFE-008` [P1] - Reschedule to Occupied Slot
- **Description**: Therapist attempts to reschedule into a slot already booked by another user.
- **Steps**: Submit `/reschedule` with occupied `newSlotId`.
- **Expected Outcome**: HTTP 409 Conflict / `ValidationError`: *"Target slot is not available."*

#### `TC-LIFE-009` [P0] - Auto No-Show Resolution via Cron (15 Min Post-Start)
- **Description**: If OTP is not verified within 15 minutes after start time, system auto-flags session as No-Show.
- **Steps**:
  1. Set session start time to `currentTime - 16 minutes` with status `CONFIRMED` (OTP unverified).
  2. Execute `sessionScheduler` cron job.
- **Expected Outcome**:
  1. Session status updated to `NO_SHOW`.
  2. `StatusLog` records system actor transition `CONFIRMED -> NO_SHOW`.
  3. Penalty/billing policy applied if configured.

#### `TC-LIFE-010` [P0] - Therapist Cancel Slot (>1 Hour Before Start)
- **Description**: Therapist cancels slot well in advance.
- **Steps**: `POST /api/v1/treatment-session/{sessionId}/cancel` at `startTime - 2 hours` with reason.
- **Expected Outcome**: Session status changed to `CANCELLED`. Full refund / slot credit initiated for patient.

#### `TC-LIFE-011` [P0] - Therapist Cancel Slot (<1 Hour Before Start - Restriction)
- **Description**: Therapist attempts cancellation less than 1 hour before start time.
- **Steps**: Call `/cancel` at `startTime - 30 minutes`.
- **Expected Outcome**:
  1. System blocks action with HTTP 400 `ValidationError`: *"Sessions cannot be cancelled by therapist within 1 hour of start time. Contact admin."*
  2. Or logs violation tag for admin review per policy.

---

## 4. Assessment Reports, Docs & Session Completion (`TS-LIFE-CLINICAL`)

#### `TC-LIFE-012` [P0] - Mandatory 1st Session Assessment Report Submission
- **Description**: Therapist must generate and submit Clinical Assessment Report during 1st session before completing it.
- **Steps**:
  1. Session #1 is `ACTIVE`.
  2. Call `POST /api/v1/treatment-session/{sessionId}/complete` without submitting clinical assessment report.
- **Expected Outcome**: Returns HTTP 400 `ValidationError`: *"Clinical Assessment Report is mandatory for the 1st session before completion."*

#### `TC-LIFE-013` [P0] - Complete 1st Session with Valid Assessment Report
- **Description**: Submit clinical assessment report and complete 1st session.
- **Steps**:
  1. `POST /api/v1/treatment-session/{sessionId}/assessment` with chief complaints, diagnosis, ROM, treatment goals, recommended sessions count.
  2. `POST /api/v1/treatment-session/{sessionId}/complete`.
- **Expected Outcome**:
  1. Clinical assessment saved in `assessment.prisma` models.
  2. Session status changes to `COMPLETED`.
  3. Treatment plan recommendation count updated.

#### `TC-LIFE-014` [P1] - Add Clinical Documents (X-Ray, CT Scan, Reports)
- **Description**: Therapist attaches medical image links with titles and descriptions.
- **Steps**: `POST /api/v1/treatment-plan/{planId}/documents` with `{ title: "X-Ray Lumbar", imageUrl: "https://s3.../xray.jpg", description: "L4-L5 compression" }`.
- **Expected Outcome**: Document record appended to `DocRecord` list in DB; valid URL format enforced via Zod.

#### `TC-LIFE-015` [P0] - 2nd Session Onwards Improvement Report Completion
- **Description**: For session #2+, session completion requires submitting an Improvement Record.
- **Steps**:
  1. Session #2 is `ACTIVE`.
  2. `POST /api/v1/treatment-session/{sessionId}/improvement` with `{ painScale: 4, mobilityScore: 8, notes: "Improved flexibility" }`.
  3. Submit `/complete`.
- **Expected Outcome**: Session marked `COMPLETED`; improvement data stored in `ImprovementRecord`.

---

## 5. Follow-up Recommendations, Multi-Session & Mutual Feedback (`TS-LIFE-PLAN`)

#### `TC-LIFE-016` [P1] - Patient Views Recommended Slots Post 1st Session
- **Description**: Patient dashboard displays recommended slots based on therapist's 1st session assessment.
- **Steps**: `GET /api/v1/patient/recommended-slots?treatmentPlanId={id}` as Patient.
- **Expected Outcome**: Returns matching slots aligned with recommended weekly frequency (e.g. 3 sessions/week).

#### `TC-LIFE-017` [P0] - Book Multiple Follow-Up Sessions on Existing Plan
- **Description**: Patient books multiple follow-up sessions under the active `TreatmentPlan`.
- **Steps**: `POST /api/v1/treatment-plan/{planId}/book-sessions` with array of `[{ slotId, date }]`.
- **Expected Outcome**:
  1. Creates multiple `TreatmentSession` records tied to existing `TreatmentPlanId`.
  2. Reuses existing patient profile and session location without re-entry.

#### `TC-LIFE-018` [P0] - Mutual Feedback Submission (Patient & Therapist)
- **Description**: Both parties submit ratings and reviews after a completed session.
- **Steps**:
  1. Patient submits `POST /api/v1/treatment-session/{sessionId}/patient-review` (1-5 stars, tags, comment).
  2. Therapist submits `POST /api/v1/treatment-session/{sessionId}/therapist-review` (compliance rating, comments).
- **Expected Outcome**: Reviews stored in `review.prisma` models; therapist aggregate rating recalculated.

#### `TC-LIFE-019` [P1] - Duplicate Review Submission Prevention
- **Description**: Patient attempts to review the same session twice.
- **Steps**: Submit patient review API twice for same `sessionId`.
- **Expected Outcome**: HTTP 409 Conflict / `ValidationError`: *"Review already submitted for this session."*

---

## 6. Treatment Plan Closure & Auto-Completion (`TS-LIFE-CLOSE`)

#### `TC-LIFE-020` [P0] - Auto-Complete Treatment Plan After 1 Week of Inactivity
- **Description**: System automatically marks treatment plan as `COMPLETED` if 1st session was completed and no new session occurred/booked for 7 consecutive days.
- **Steps**:
  1. Set `TreatmentPlan` last activity timestamp to `now - 8 days` with status `ACTIVE`.
  2. Run `sessionScheduler` plan auto-complete cron job.
- **Expected Outcome**:
  1. `TreatmentPlan` status changes to `AUTO_COMPLETED`.
  2. Reason logged as *"Auto-completed due to 7 days of inactivity post 1st session"*.

#### `TC-LIFE-021` [P0] - Therapist Manual Plan Completion with Final Improvement Report
- **Description**: Therapist completes treatment plan by submitting final improvement report and optional outcome photos.
- **Steps**: `POST /api/v1/treatment-plan/{planId}/final-complete` with `{ finalPainScale: 1, overallOutcome: "Fully Recovered", outcomeImageUrl: "https://..." }`.
- **Expected Outcome**:
  1. Plan status changes to `COMPLETED`.
  2. `completedAt` timestamp logged.
  3. Plan locked from adding further sessions unless re-opened.

---

## 7. Security, Authorization & Error Edge Cases

| Test Case ID | Risk Category | Scenario | Expected Endpoint Behavior |
|---|---|---|---|
| `TC-SEC-001` | Auth Guard | Patient attempts to verify therapist OTP endpoint | HTTP 403 Forbidden (`TherapistOnly` middleware blocks execution) |
| `TC-SEC-002` | Auth Guard | Unauthenticated request to hold slot or start session | HTTP 401 Unauthorized (`verifyJWT` failure) |
| `TC-SEC-003` | Data Isolation | Patient A attempts to view Patient B's assessment report | HTTP 403 Forbidden / HTTP 404 NotFound Error |
| `TC-EDGE-001` | Database | Invalid 24-character hex ObjectId string passed in route parameter | HTTP 400 `ValidationError`: *"Invalid ObjectId format"* |
| `TC-REDIS-001` | Resiliency | Upstash Redis connection failure during slot hold | System gracefully falls back to database lock or returns 502 `DatabaseError` |

---

## 💡 Recommended Execution Strategy

1. **Automated Integration Tests (Jest / Supertest)**: Implement API route integration tests using a test MongoDB instance and Mock Redis client for `TC-BOOK-004` to `TC-BOOK-013`.
2. **Cron Scheduler Testing**: Unit test `sessionScheduler.ts` functions by passing mocked system timestamps for No-Show (`TC-LIFE-009`) and 7-day plan auto-completion (`TC-LIFE-020`).
3. **Concurrency Simulation**: Use `k6` or `Autocannon` to simulate 50 simultaneous slot hold requests (`TC-BOOK-005`) to verify zero double-booking under race conditions.
