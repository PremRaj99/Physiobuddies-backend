import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const therapistSessionDocs = swaggerRouter('/therapist/sessions', ['Therapist Sessions']);

therapistSessionDocs.get('/my-bookings', {
  summary: 'Get Therapist Bookings',
  success: success(200),
});

therapistSessionDocs.get('/my-bookings/:id', {
  summary: 'Get Booking Details By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});

therapistSessionDocs.patch('/my-bookings/:id/accept', {
  summary: 'Accept Booking Request',
  params: ParamsObjectIdSchema,
  success: success(200),
});

therapistSessionDocs.post('/my-bookings/:id/generate-otp', {
  summary: 'Generate Session Start OTP',
  params: ParamsObjectIdSchema,
  success: success(200),
});

therapistSessionDocs.post('/my-bookings/:id/verify-otp', {
  summary: 'Verify Session OTP and Start Session',
  params: ParamsObjectIdSchema,
  success: success(200),
});

therapistSessionDocs.post('/my-bookings/:id/end', {
  summary: 'End Therapy Session',
  params: ParamsObjectIdSchema,
  success: success(200),
});

therapistSessionDocs.post('/plan/:id/complete', {
  summary: 'Mark Entire Treatment Plan Complete',
  params: ParamsObjectIdSchema,
  success: success(200),
});

therapistSessionDocs.get('/today', {
  summary: 'Get Today Sessions',
  success: success(200),
});

therapistSessionDocs.get('/upcoming', {
  summary: 'Get Upcoming Sessions',
  success: success(200),
});
