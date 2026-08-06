# Technical Implementation Plan: Booking & Treatment Lifecycle Engine

**Project:** PhysioBuddies API (v2)  
**Version:** 2.0.0  
**Location:** `api2/plan/implementation_plan.md`  
**Target Workspace:** `c:\Users\premr\OneDrive\Documents\PhysioBuddies\api2`

---

## 1. Executive Technical Overview

This implementation plan details the engineering architecture required to build the production-grade Booking & Treatment Lifecycle Engine in the `api2` backend repository.

Key Technical Architecture:
1. **Two-Phase Redis Slot Lock Engine**:
   - Lock payload JSON with `bookingId`, `patientId`, `phase`, `createdAt`, `previewId`.
   - Redis server time as absolute single source of truth (`TIME`).
   - Same-patient multi-tab lock reuse.
   - Phase 1 (10-min form fill) -> Phase 2 (10-min payment extension with frozen preview pricing).
2. **Resilient Webhook & Fail-Safe Pipeline**:
   - Expired lock webhook auto-refund trigger (`refund.initiated`).
   - Idempotent `200 OK` handler for webhook retries with `WebhookEventLog`.
   - 3-tier DB transaction retry with fallback `AdminIncidentReport` generation.
3. **Session Authentication & SLA**:
   - 5-attempt OTP lockout logic stored in Redis hash.
   - Automated 15-min SLA sweeper marking `therapist_no_show` vs therapist-initiated `patient_no_show`.
   - Reschedule counters enforcing max 2 reschedules for therapist and patient.
4. **Governance & Audit Infrastructure**:
   - Immutable `AuditLog` schema for all admin overrides and state mutations.
   - Admin override endpoints (reopen session/plan, regenerate OTP, review moderation).

---

## 2. Architecture & File Structure

```
api2/src/
├── shared/
│   ├── redis/
│   │   ├── redis.client.ts              # Redis connection pool & singleton instance
│   │   └── slotHold.redis.ts            # Lock ownership JSON, 2-phase extension, 5-attempt OTP & clock drift
│   ├── audit/
│   │   └── auditLog.service.ts          # Immutable AuditLog helper
│   └── utils/
│       └── date.util.ts                 # UTC ISO-8601 & Local timezone utilities
├── modules/
│   ├── treatment-lifecycle/
│   │   ├── reservation/
│   │   │   ├── reservation.controller.ts # Lock hold (P1), preview/extend (P2), webhook & refund handlers
│   │   │   ├── reservation.service.ts    # Slot calculation, 2-phase lock, webhook idempotency & fail-safes
│   │   │   ├── reservation.routes.ts     # Route registrations
│   │   │   └── reservation.schema.ts     # Zod schemas (condition & DescribedAs)
│   │   ├── treatment-session/
│   │   │   ├── session.controller.ts     # OTP gen/verify (5-attempt max), no-show, complete handlers
│   │   │   ├── session.service.ts        # OTP logic, SLA check, immutable assessment, max 2 reschedules
│   │   │   ├── session.routes.ts         # Route registrations
│   │   │   └── session.schema.ts         # Zod schemas for OTP, assessment & progress
│   │   ├── treatment/
│   │   │   ├── treatmentPlan.controller.ts # Plan creation, list, completion handlers
│   │   │   ├── treatmentPlan.service.ts    # Plan status transition & 7-day abandoned/complete sweeper
│   │   │   ├── treatmentPlan.routes.ts     # Plan endpoints
│   │   │   └── treatmentPlan.schema.ts     # Zod validation schemas
│   │   └── cron/
│   │       ├── reminder.cron.ts          # 1-hour pre-session notification cron job
│   │       ├── noShow.cron.ts            # 15-minute SLA therapist_no_show enforcement cron job
│   │       └── planSweeper.cron.ts       # 7-day inactivity abandoned/completed plan sweeper
│   └── admin/
│       ├── adminOverride.controller.ts   # Reopen session/plan, force complete, review moderation
│       ├── adminOverride.service.ts      # Admin business logic & audit trail generator
│       └── adminOverride.routes.ts       # Admin routes
```

---

## 3. Database Schema Alignments (Prisma)

### 3.1 New Audit & Governance Models (`system.prisma`)

```prisma
model AuditLog {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  actorId    String   @db.ObjectId
  actorRole  UserRole
  action     String
  entityName String
  entityId   String   @db.ObjectId
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String?
  reason     String
  createdAt  DateTime @default(now())

  @@index([entityName, entityId])
  @@index([actorId])
}

model WebhookEventLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  invoiceId   String
  eventId     String
  ip          String
  payload     Json
  isDuplicate Boolean  @default(false)
  receivedAt  DateTime @default(now())

  @@index([invoiceId])
}

model AdminIncidentReport {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  type        String   // DB_INSERT_FAILED, EXPIRED_LOCK_PAYMENT, SCHEDULE_CONFLICT
  referenceId String
  details     Json
  isResolved  Boolean  @default(false)
  resolvedBy  String?  @db.ObjectId
  createdAt   DateTime @default(now())
}
```

### 3.2 Enum Updates (`treatment.prisma` & `payment.prisma`)

* **`SessionStatus`**:
  `pending` | `confirmed` | `active` | `completed` | `settled` | `cancelled` | `patient_no_show` | `therapist_no_show` | `expired`
* **`TreatmentPlanStatus`**:
  `treatment_planned` | `ongoing` | `completed` | `cancelled` | `abandoned`
* **`PaymentStatus`**:
  `created` | `pending` | `authorized` | `captured` | `failed` | `expired` | `refunded`
* **`RefundStatus`**:
  `initiated` | `processing` | `success` | `failed`
* **`NotificationStatus`**:
  `queued` | `sent` | `delivered` | `failed`

---

## 4. Detailed Implementation Modules

### Module 1: Two-Phase Redis Slot Lock Engine (`slotHold.redis.ts`)
* **`acquireSlotLock(therapistId, dateStr, startHour, patientId, bookingId)`**:
  - Key: `slot:hold:${therapistId}:${dateStr}:${startHour}`
  - Check existing key: If key exists and `existingData.patientId === patientId`, **reuse lock** and return `true`.
  - Otherwise, run `redis.set(key, JSON.stringify({ bookingId, patientId, phase: 1, createdAt: redisTime }), 'NX', 'EX', 600)`.
* **`extendSlotLock(therapistId, dateStr, startHour, patientId, previewId)`**:
  - Check lock data matches `patientId`.
  - Update payload with `phase: 2`, `previewId`.
  - Execute `redis.expire(key, 600)`. Resets lock for **additional 10 minutes** for payment.
* **OTP Attempt Management (`session:otp:${sessionId}`)**:
  - Store `{ otpCode, attempts: number }`.
  - Increment `attempts` on failed verification. On `attempts >= 5`, lock OTP verification for 15 minutes and invalidate current OTP.

### Module 2: Resilient Webhook & Fail-Safe Pipeline (`reservation.service.ts`)
1. Receive Payment Webhook:
   - Check `WebhookEventLog` for `invoiceId`. If found, log duplicate and return `200 OK` (`status: "already_processed"`).
2. Verify Redis Lock `slot:hold:...`:
   - If Redis lock missing/expired -> Call `initiateAutoRefund(paymentId)` -> Return `200 OK` (`status: "expired_lock_refunded"`).
3. Execute Database Persistence Transaction (`prisma.$transaction`):
   - Retry loop (up to 3 attempts with exponential backoff).
   - If transaction succeeds: Delete Redis hold & preview keys, dispatch `BOOKING_CONFIRMED` notifications.
   - If 3 retries fail: Call `createAdminIncidentReport("DB_INSERT_FAILED", invoiceId)` and queue automated refund.

### Module 3: Session Governance & Reschedule Limits (`session.service.ts`)
1. **Reschedule Enforcement**:
   - Check `session.rescheduleLogs.filter(log => log.changedBy === role).length < 2`.
   - If count >= 2, throw `400 Bad Request: Maximum 2 reschedules allowed per role`.
2. **Immutable Clinical Assessment**:
   - `submitClinicalAssessment()` checks if assessment already exists for `treatmentPlanId`.
   - If exists, throw `400 Bad Request: ClinicalAssessment is immutable and cannot be updated`.
3. **`patient_no_show` vs `therapist_no_show`**:
   - Therapist triggers `POST /sessions/:id/no-show` -> Sets `patient_no_show`.
   - Background cron `noShow.cron.ts` runs 15 minutes past start time without OTP verification -> Sets `therapist_no_show` and queues full refund.

### Module 4: Admin Overrides & Audit Logging (`adminOverride.service.ts`)
* Implements `reopenSession()`, `regenerateOTP()`, `forceCompletePlan()`, and `moderateReview()`.
* Automatically writes to `AuditLog` table with `actorId`, `action`, `oldValue`, `newValue`, `reason`, and `ipAddress`.

---

## 5. Verification Plan

### Automated Build & Validation
```bash
# 1. Format Prisma schema files
npm run prisma:format

# 2. Validate Prisma schema
npx prisma validate

# 3. Check TypeScript compilation
npm run build
```

### Manual & API Verification Scenarios
1. **Multi-Tab Lock Reuse**:
   - Lock slot in Tab 1 (`patient_123`), send same lock request from Tab 2 (`patient_123`). Verify lock is reused and returns 200 OK.
2. **Expired Lock Webhook Auto-Refund**:
   - Simulate webhook arrival after Redis lock expiration. Verify status changes to `refunded` and refund alert is dispatched.
3. **5-Attempt OTP Lockout**:
   - Submit 5 wrong OTPs for a session. Verify 5th attempt locks verification for 15 minutes.
4. **Reschedule Limit**:
   - Attempt to reschedule a session 3 times as therapist. Verify 3rd attempt is rejected with 400 Bad Request.
5. **Immutable Clinical Assessment**:
   - Submit clinical assessment, then attempt to re-submit or edit. Verify edit is blocked.
6. **Audit Log Verification**:
   - Perform admin session reopen override. Check `AuditLog` table contains full `oldValue`, `newValue`, and `reason`.
