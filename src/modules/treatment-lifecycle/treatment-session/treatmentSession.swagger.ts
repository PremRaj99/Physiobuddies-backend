import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import {
  AddDocsSchema,
  BookMoreSessionSchema,
  CancelSessionSchema,
  RescheduleSlotSchema,
} from './treatmentSession.type';

const treatmentSessionDocs = swaggerRouter('/treatment-session', ['Treatment Session Lifecycle']);

treatmentSessionDocs.get('/:id', {
  summary: 'Get Session Details',
  success: success(200),
  errors: [404],
});

treatmentSessionDocs.post('/:id/notification', {
  summary: 'Send Session Notification',
  success: success(200),
});

treatmentSessionDocs.post('/:id/cancel', {
  summary: 'Cancel Session',
  body: CancelSessionSchema,
  success: success(200),
});

treatmentSessionDocs.post('/:id/no-show', {
  summary: 'Mark Session No-Show',
  success: success(200),
});

treatmentSessionDocs.get('/:id/see-more-slots', {
  summary: 'View Available Follow-Up Slots',
  success: success(200),
});

treatmentSessionDocs.post('/book-more-session', {
  summary: 'Book Additional Session',
  body: BookMoreSessionSchema,
  success: success(200),
});

treatmentSessionDocs.post('/:id/start', {
  summary: 'Start Treatment Session',
  success: success(200),
});

treatmentSessionDocs.post('/:id/complete', {
  summary: 'Complete Treatment Session',
  success: success(200),
});

treatmentSessionDocs.post('/confirm', {
  summary: 'Confirm Pending Booking Session',
  success: success(200),
});

treatmentSessionDocs.post('/:id/send-otp', {
  summary: 'Send Session OTP',
  success: success(200),
});

treatmentSessionDocs.post('/:id/verify-otp', {
  summary: 'Verify Session OTP',
  success: success(200),
});

treatmentSessionDocs.post('/:id/reschedule-slot', {
  summary: 'Reschedule Session Slot',
  body: RescheduleSlotSchema,
  success: success(200),
});

treatmentSessionDocs.post('/:id/add-docs', {
  summary: 'Add Session Documents',
  body: AddDocsSchema,
  success: success(200),
});
