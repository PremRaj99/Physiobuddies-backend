import { randomInt } from 'crypto';
import { ForbiddenError, ValidationError } from '@/core/errors/ApiError';
import type { TreatmentSession, TreatmentPlan } from '@prisma/client';

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Return a Date that is `minutes` from now (default: 10 min).
 */
export function getOtpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * OTP can be sent only on the same day and within 10 min before the session
 * start time through the session duration (40 min slot).
 *
 * @param sessionDate The scheduled date of the session
 * @param startHour   The startHour of the slot (6-21)
 * @param slotDurationMinutes Duration of a session slot in minutes (default 40)
 * @param leadMinutes How many minutes before start the OTP is allowed (default 10)
 */
export function isWithinOtpWindow(
  sessionDate: Date,
  startHour: number,
  slotDurationMinutes = 40,
  leadMinutes = 10,
): boolean {
  const now = new Date();

  // Build the actual start time from session date + startHour
  const slotStart = new Date(sessionDate);
  slotStart.setUTCHours(startHour, 0, 0, 0);

  const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);
  const windowStart = new Date(slotStart.getTime() - leadMinutes * 60 * 1000);

  return now >= windowStart && now <= slotEnd;
}

/**
 * Check whether the current time is within the allowed cancellation window.
 * Sessions can be cancelled only BEFORE the scheduled start time.
 */
export function isWithinCancellationWindow(sessionDate: Date, startHour: number): boolean {
  const now = new Date();
  const slotStart = new Date(sessionDate);
  slotStart.setUTCHours(startHour, 0, 0, 0);
  return now < slotStart;
}

/**
 * Assert that the requesting therapist owns this session via the treatment plan.
 * Throws ForbiddenError if not.
 */
export function assertTherapistOwnership(
  session: TreatmentSession & { treatmentPlan: TreatmentPlan },
  therapistId: string,
): void {
  if (session.treatmentPlan.therapistId !== therapistId) {
    throw new ForbiddenError('You do not own this treatment session.');
  }
}

/**
 * Assert that the session is in one of the expected statuses, otherwise throw.
 */
export function assertSessionStatus(
  session: TreatmentSession,
  expectedStatuses: string[],
  action: string,
): void {
  if (!expectedStatuses.includes(session.status)) {
    throw new ValidationError(
      `Cannot ${action}: session is in '${session.status}' status. Expected one of: ${expectedStatuses.join(', ')}`,
    );
  }
}

/**
 * Build the OTP email HTML for sending to the patient.
 */
export function buildOtpEmailHtml(otp: string, therapistName: string, sessionDate: Date): string {
  const dateStr = sessionDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #014f86; margin-bottom: 8px;">Physiobuddies – Session Verification</h2>
      <p>Your therapist <strong>${therapistName}</strong> has arrived for your session scheduled on <strong>${dateStr}</strong>.</p>
      <p>Please share this OTP with your therapist to start the session:</p>
      <div style="background: #f0f7ff; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #014f86;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 13px;">This OTP expires in 10 minutes. Do not share it with anyone else.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #999; font-size: 12px;">If you did not request this, please contact support immediately.</p>
    </div>
  `;
}
