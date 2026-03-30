import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { TherapistQuerySchema } from './therapist.type';

const therapistDocs = swaggerRouter('/therapist', ['Therapist']);

therapistDocs.get('/', {
  summary: 'Get All Therapists',
  query: TherapistQuerySchema,
  success: success(200),
});

therapistDocs.get('/:id', {
  summary: 'Get Therpist By Id',
  params: ParamsObjectIdSchema,
  query: TherapistQuerySchema,
  success: success(200),
});

therapistDocs.get('/:id/reviews', {
  summary: 'Get Therpist Reviews',
  params: ParamsObjectIdSchema,
  query: TherapistQuerySchema,
  success: success(200),
});

therapistDocs.get('/:id/articles', {
  summary: 'Get Therpist Articles',
  params: ParamsObjectIdSchema,
  query: TherapistQuerySchema,
  success: success(200),
});

therapistDocs.get('/:id/faqs', {
  summary: 'Get Therpist Faqs',
  params: ParamsObjectIdSchema,
  query: TherapistQuerySchema,
  success: success(200),
});

therapistDocs.get('/:id/availability', {
  summary: 'Get Therpist Availability',
  params: ParamsObjectIdSchema,
  success: success(200),
});
