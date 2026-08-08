# Product Requirements Document (PRD): Booking & Treatment Lifecycle Engine

**Project:** PhysioBuddies API (v2)  
**Version:** 2.0.0  
**Author:** Engineering & Product Team  
**Status:** Approved for Implementation  
**Location:** `api2/plan/prd.md`

---

## 1. Executive Summary

PhysioBuddies is an on-demand digital physiotherapy platform connecting patients with certified physiotherapists for home visits, clinic visits, and online consultations.

This PRD defines the production-grade specifications for two core system pillars:

1. **High-Concurrency Two-Phase Redis Slot Lock Engine**: A zero-double-booking reservation engine utilizing atomic Redis locks with a 2-phase 10+10 minute TTL strategy (10 minutes for form filling + an additional 10 minutes for payment completion upon form submission), enriched lock ownership metadata, clock drift mitigation, multi-tab lock reuse, and automated fail-safe refund handling.
2. **Comprehensive Treatment Lifecycle & Governance Engine**: An interactive clinical workflow featuring 1-hour pre-session alerts, 5-attempt OTP brute-force prevention, explicit `patient_no_show` vs `therapist_no_show` classifications, strict reschedule limits (max 2), immutable clinical assessments, anonymous non-editable reviews with admin moderation, automated 7-day inactivity plan completion, complete state machines (Payment, Refund, Payout, Session, Plan, Notification), admin override powers, and immutable audit logging.

---

## 2. Goals & Non-Goals

### 2.1 Goals

- **Zero Double-Booking Guarantee via Two-Phase Lock**:
  - **Phase 1 (Form Filling)**: Atomic 10-minute slot lock (`EX 600`) to fill patient details, location, condition, and issue description.
  - **Phase 2 (Payment Completion)**: Upon form submission, atomic lock TTL is renewed for an **additional 10 minutes** (`EXPIRE 600`) alongside booking preview caching, granting a full 10-minute payment processing window. Price is frozen in preview.
  - **Multi-Tab Safety**: Same patient opening multiple tabs reuses the existing active lock.
- **Resilient Payment & Webhook Architecture**:
  - Webhooks arriving after lock expiration trigger **automatic refunds**.
  - Duplicate webhooks return `200 OK` idempotently with duplicate logging.
  - DB insert failures trigger up to 3 transaction retries; if exhausted, an **Automated Admin Incident Report** is generated and refund is queued.
- **Granular Session Authentication & SLA**:
  - Redis-backed 6-digit OTP with maximum 5 failed attempts (15-min lock on 5th failure).
  - Explicit distinction between **`patient_no_show`** (patient absent/uncooperative) and **`therapist_no_show`** (therapist fails to arrive/generate OTP within 15 min).
- **Reschedule Governance**: Strictly enforce maximum **2 reschedules** per session/plan for therapist and **2 reschedules** for patient (>= 1 hour prior).
- **Clinical Compliance & Continuity**:
  - Mandatory, **immutable** 1st-session `ClinicalAssessment`.
  - Automatic calculation of `remainingRecommendedSessions` (e.g. 10 recommended - 2 booked = 8 remaining).
- **Self-Healing & Admin Governance**:
  - Auto-complete inactive treatment plans after 7 days without sessions (`abandoned` vs `cancelled` differentiation).
  - Comprehensive Admin Override suite (reopen session/plan, regenerate OTP, force complete) backed by an **Immutable Audit Log**.

### 2.2 Non-Goals

- Custom video streaming protocol development (third-party WebRTC provider used for online mode).
- In-app medical prescription pharmacy integration (out of scope for v2).

---

## 3. System Roles & Actors

| Role                      | Description                                                                                                                                                       |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Patient**               | Searches therapists, locks slots, fills health details & location, pays, receives therapy, views assessments, and provides feedback.                              |
| **Therapist**             | Manages availability, receives booking alerts, generates OTP, verifies OTP, conducts therapy, logs assessments & improvement reports, and completes plans.        |
| **System Cron / Workers** | Manages 2-phase slot lock expiration, sends pre-session notifications (1h prior), executes 15-min no-show checks, auto-refunds, and 7-day plan completion sweeps. |
| **Admin**                 | Oversees session status overrides, dispute resolution, fraudulent review moderation, manual refunds, and system audit logs.                                       |

---

## 4. Feature Specifications & Edge-Case Architecture

### 4.1 Slot Calculation Formula & Clock Drift Standard

- **Slot Availability Formula**:  
  `Available Slots` = `TherapistSlot Weekly Template`  
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`MINUS TherapistLeave Date Ranges`  
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`MINUS Persistent DB SlotReservations (status: booked)`  
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`MINUS Active Transient Redis Slot Holds (slot:hold:*)`
- **Single Source of Clock Truth**:
  - Across background workers, payment gateways, and API instances, **Redis Server Time (`TIME` command / server clock)** is defined as the absolute single source of truth for lock TTLs, OTP expiration, and 15-minute SLA windows to prevent clock drift inconsistencies.

---

### 4.2 Two-Phase Redis Slot Lock & Payment Engine

#### Phase 1: Slot Reservation & Form Filling (10 Minutes)

- **Trigger**: Patient selects an available time slot (`POST /api/v2/booking/slots/hold`).
- **Redis Key Pattern**: `slot:hold:{therapistId}:{YYYY-MM-DD}:{startHour}`
- **Lock Ownership Payload** (JSON stored in Redis string for debugging & audit):
  ```json
  {
    "bookingId": "bk_8f9a2b",
    "patientId": "pat_67890",
    "phase": 1,
    "createdAt": "2026-08-06T22:44:00.000Z",
    "previewId": null
  }
  ```
- **Multi-Tab Handling**: If the same patient opens a 2nd tab and selects the same slot, the API checks `lockData.patientId === requestingPatientId`. If it matches, the system **reuses the existing lock** without error, returning the active lock metadata.
- **Form Fill Window**: Grants **10 minutes (600s)** to enter `PatientDetail`, `PatientLocation`, `condition`, and `DescribedAs`.

#### Phase 2: Form Submission, Coupon Freeze & Payment Window (+10 Minutes)

- **Trigger**: Patient submits form and clicks "Proceed to Checkout" (`POST /api/v2/booking/preview`).
- **Lock Extension**: API validates patient ownership, updates `phase: 2` in lock payload, and executes `EXPIRE slot:hold:{therapistId}:{date}:{startHour} 600`.
  - **Effect**: Resets lock TTL to grant an **additional 10 minutes** for payment completion.
- **Price & Coupon Freeze**:
  - The calculated pricing (including applied coupons) is **frozen** inside `booking:preview:{previewId}` payload.
  - Even if the coupon expires on the DB side while the patient is on the gateway page, the frozen preview price remains valid during the 10-minute payment window.

---

### 4.3 Webhook Edge Cases & Fail-Safe Handling

1. **Webhook Arrives After Redis Lock Expired**:
   - If payment succeeds on gateway but Redis lock `slot:hold:...` has expired:
   - System immediately triggers an **Automatic Refund** (`RefundStatus: initiated -> processing -> success`).
   - Payment status marked `refunded`. Patient notified via `payment_refunded` alert.
2. **Payment Gateway Webhook Retries (Idempotency)**:
   - **Response Code**: Return `200 OK` with `{ status: "already_processed", invoiceId }`.
   - Idempotent check via `invoiceId` / `gatewayPaymentId`. If already processed, ignore payload execution.
   - **Duplicate Event Logging**: Record attempt in `WebhookEventLog` with `ip`, `payload`, `receivedAt`, `isDuplicate: true`.
3. **Payment Succeeds but DB Insert Fails**:
   - DB operations wrapped in `prisma.$transaction` with **3 automatic retries** (exponential backoff).
   - If all retries fail:
     - Automatically queue refund or lock resources.
     - Generate an **Automated Admin Incident Report** (`AdminIncidentReport`) for instant reconciliation dashboard alert.
4. **Therapist Edits Availability / Blocks Slot During Active User Lock / Payment**:
   - Active Redis lock takes precedence. If therapist modifies schedule or attempts manual block:
   - System permits payment completion if lock was active. If schedule conflict arises, system creates an **Automated Admin Incident Report**. **Admin can override** (confirm slot or reassign/refund).

---

### 4.4 Pre-Session SLA, OTP Security & Reschedule Rules

- **1-Hour Pre-Session Reminder**: Cron triggers notification 60 minutes prior to scheduled start time.
- **OTP Session Activation (Max 5 Failed Attempts)**:
  - Therapist generates OTP at session start (`session:otp:{sessionId}`).
  - Redis tracks `{ otpCode, attempts: 0 }` with 10-minute TTL.
  - **Security Rule**: Maximum **5 failed attempts**. On 5th wrong entry:
    - OTP input is locked for 15 minutes. Current OTP invalidated.
    - Therapist must generate a fresh OTP. Event logged to security audit.
- **Explicit No-Show Classifications**:
  - **`patient_no_show`**: Therapist arrives at location / starts online session, but patient is absent or uncooperative (OTP verification impossible). Therapist logs no-show. Patient charged; therapist payout processed.
  - **`therapist_no_show`**: 15 minutes pass after start time without therapist generating/verifying OTP. System cron transitions session to `therapist_no_show`. Full refund issued to patient; therapist penalized.
- **Reschedule Governance**:
  - **Therapist Reschedule Limit**: Maximum **2 reschedules** per session/plan.
  - **Patient Reschedule Limit**: Maximum **2 reschedules** per session/plan (must be requested >= 1 hour before start time).

---

### 4.5 Clinical Assessment, Document Records & Plan Continuity

- **Mandatory & Immutable 1st-Session Clinical Assessment**:
  - Therapist **must** submit `ClinicalAssessment` during/at end of 1st session before calling `/sessions/:id/complete`.
  - **Immutability Rule**: `ClinicalAssessment` cannot be edited after final submission. Any subsequent updates must be added as follow-up notes or document attachments (`TreatmentPlanDocRecord`).
- **Recommended vs Booked Sessions Tracking**:
  - When assessment recommends $N$ sessions (e.g., 10 sessions), system tracks:
    $$\text{remainingRecommendedSessions} = \text{suggestedTreatmentDays} - \text{bookedSessionsCount}$$
  - Patient dashboard displays remaining recommended sessions for easy 1-click follow-up bookings attached to the active `TreatmentPlan`.

---

### 4.6 Treatment Plan Termination & Inactivity Sweeper

- **`cancelled` vs `abandoned` Definitions**:
  - **`cancelled`**: Plan explicitly cancelled by patient, therapist, or admin (e.g. refund issued, patient relocated, or medical disqualification).
  - **`abandoned`**: System auto-classified state when a patient stops booking sessions midway after 1st session, and 7 calendar days pass with no active/upcoming bookings.
- **Automated 7-Day Inactivity Sweeper**:
  - Daily cron scans plans with status `ongoing` or `treatment_planned`.
  - If last session activity is > 7 days ago and no future sessions exist, status transitions to `completed` (or `abandoned` if < 50% recommended sessions completed).

---

### 4.7 Review & Rating Governance

- **Non-Editable & Anonymous**: Patient and therapist reviews are non-editable post-submission and displayed anonymously on public profiles.
- **Admin Review Moderation**: Admin has dedicated tool to flag/hide fraudulent or abusive reviews (`isHiddenByAdmin: true`, `moderatedBy`, `moderationReason`). Hidden reviews are excluded from therapist rating average calculations.

---

## 5. Complete State Machine Specifications

### 5.1 Payment Status Lifecycle

`created` -> `pending` -> `authorized` -> `captured`  
_Terminal/Failure states:_ `failed` | `expired` | `refunded`

```
  [Payment Created] ---> [Pending Gateway] ---> [Authorized] ---> [Captured / Success]
                                |                     |
                                v                     v
                           [Failed]               [Refunded] (Auto/Manual)
```

### 5.2 Refund Status Lifecycle

`initiated` -> `processing` -> `success`  
_Terminal failure state:_ `failed`

### 5.3 Payout Status Lifecycle

`pending` -> `processing` -> `paid`  
_Terminal failure state:_ `failed`

### 5.4 Session Status Lifecycle

`pending` -> `confirmed` -> `active` -> `completed`  
_Exception/Failure states:_ `patient_no_show` | `therapist_no_show` | `cancelled` | `expired`

### 5.5 Treatment Plan Status Lifecycle

`treatment_planned` -> `ongoing` -> `completed`  
_Terminal exception states:_ `cancelled` | `abandoned`

### 5.6 Notification Status Lifecycle

`queued` -> `sent` -> `delivered`  
_Failure state:_ `failed`

---

## 6. Admin Override Permissions & Immutable Audit Trail

### 6.1 Admin Override Suite

Admins possess explicit override powers accessible via secure admin APIs:

- **Reopen Session**: Revert `completed` / `cancelled` session back to `active` or `confirmed`.
- **Regenerate OTP**: Force-generate new OTP bypassing therapist rate limits.
- **Force Complete**: Manually complete a stuck session or treatment plan.
- **Reopen Completed Plan**: Transition `completed` / `abandoned` plan back to `ongoing`.
- **Manual Refund Overrides**: Process Full Refund, Partial Refund, or No Refund decisions with custom notes.

### 6.2 Immutable Audit Log (`AuditLog`)

Every administrative override, state mutation, or security event generates an unalterable audit log entry:

| Field        | Type                                             | Description                                                      |
| :----------- | :----------------------------------------------- | :--------------------------------------------------------------- |
| `id`         | ObjectId                                         | Unique audit record ID                                           |
| `actorId`    | ObjectId                                         | User ID of actor making the change                               |
| `actorRole`  | Enum (`admin`, `system`, `therapist`, `patient`) | Role of actor                                                    |
| `action`     | String                                           | Operation name (e.g. `SESSION_REOPEN`, `ADMIN_REFUND`)           |
| `entityName` | String                                           | Affected entity (`TreatmentSession`, `TreatmentPlan`, `Payment`) |
| `entityId`   | ObjectId                                         | Affected entity ID                                               |
| `oldValue`   | Json                                             | Snapshot of state prior to change                                |
| `newValue`   | Json                                             | Snapshot of state after change                                   |
| `ipAddress`  | String                                           | Origin IP address                                                |
| `userAgent`  | String                                           | Origin User-Agent header                                         |
| `reason`     | String                                           | Required explanation note for action                             |
| `createdAt`  | DateTime                                         | Immutable timestamp (UTC)                                        |

---

## 7. Notification Matrix

| Event Code             | Trigger Condition                                     | Recipient           | Channel          |
| :--------------------- | :---------------------------------------------------- | :------------------ | :--------------- |
| `REMINDER_1H`          | T = 60m before session start                          | Therapist & Patient | Push, SMS        |
| `BOOKING_CONFIRMED`    | Successful payment & reservation creation             | Therapist & Patient | Push, Email      |
| `PAYMENT_FAILED`       | Gateway payment failure or timeout                    | Patient             | Push, SMS        |
| `THERAPIST_CANCELLED`  | Therapist cancels session                             | Patient             | Push, SMS, Email |
| `FOLLOWUP_RECOMMENDED` | Clinical assessment completed with remaining sessions | Patient             | Push, App Banner |
| `ASSESSMENT_UPLOADED`  | Therapist submits 1st session assessment              | Patient             | Push, Email      |
| `REFUND_INITIATED`     | Automated or manual refund triggered                  | Patient             | Push, Email, SMS |
| `PAYOUT_COMPLETED`     | Therapist wallet payout processed                     | Therapist           | Push, Email      |

---

## 8. Timezone & Timestamp Standard

- **Database Storage**: All datetime fields (`createdAt`, `startTime`, `actualStartTime`, `date`) are stored in strict **UTC ISO-8601** format.
- **Display Format**: Rendered in the patient/therapist **Local Timezone** on client applications.
- **Slot Boundaries & DST**: Slot calculations and 15-minute SLA checks compute offsets using UTC epoch minutes, guaranteeing zero disruption during Daylight Saving Time transitions or cross-timezone operations.

---

## 9. API Endpoint Matrix

| Method | Endpoint                                  | Access            | Purpose                                                                                                  |
| :----- | :---------------------------------------- | :---------------- | :------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v2/booking/therapists/search`       | Public            | Search available therapists by criteria & date                                                           |
| `POST` | `/api/v2/booking/slots/hold`              | Patient           | Lock slot (Phase 1: 10 min form filling window, supports lock reuse)                                     |
| `POST` | `/api/v2/booking/preview`                 | Patient           | Submit details (`condition`, `describedAs`), freeze price & renew lock (Phase 2: +10 min payment window) |
| `POST` | `/api/v2/booking/checkout`                | Patient           | Initiate gateway payment for locked slot                                                                 |
| `POST` | `/api/v2/booking/webhook`                 | System            | Idempotent payment webhook handler with auto-refund fallback                                             |
| `POST` | `/api/v2/sessions/:id/generate-otp`       | Therapist         | Generate & send session start OTP via Redis                                                              |
| `POST` | `/api/v2/sessions/:id/verify-otp`         | Therapist         | Verify OTP (5-attempt max enforcement) & set status `active`                                             |
| `POST` | `/api/v2/sessions/:id/reschedule`         | Patient/Therapist | Reschedule session (enforces max 2 reschedules)                                                          |
| `POST` | `/api/v2/sessions/:id/cancel`             | Patient/Therapist | Cancel session (enforces 1h rule)                                                                        |
| `POST` | `/api/v2/sessions/:id/no-show`            | Therapist         | Mark session as `patient_no_show`                                                                        |
| `POST` | `/api/v2/sessions/:id/assessment`         | Therapist         | Submit 1st session mandatory immutable Clinical Assessment                                               |
| `POST` | `/api/v2/sessions/:id/improvement-record` | Therapist         | Submit session improvement report (2nd+ session)                                                         |
| `POST` | `/api/v2/sessions/:id/documents`          | Therapist         | Attach X-Ray/CT Scan/Lab report URLs                                                                     |
| `POST` | `/api/v2/sessions/:id/complete`           | Therapist         | Finalize session completion                                                                              |
| `POST` | `/api/v2/treatment-plans/:id/complete`    | Therapist         | Submit final plan improvement & mark complete                                                            |
| `POST` | `/api/v2/reviews/session`                 | Patient/Therapist | Submit anonymous non-editable review                                                                     |
| `POST` | `/api/v2/admin/reviews/:id/moderate`      | Admin             | Hide fraudulent review                                                                                   |
| `POST` | `/api/v2/admin/sessions/:id/override`     | Admin             | Reopen session / force complete with audit log                                                           |
| `POST` | `/api/v2/admin/refunds/process`           | Admin             | Process manual full/partial/no-refund decision                                                           |
