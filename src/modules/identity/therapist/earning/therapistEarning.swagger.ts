import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const therapistEarningDocs = swaggerRouter('/therapist/earnings', ['Therapist Earnings']);

therapistEarningDocs.get('/', {
  summary: 'Get Earnings',
  success: success(200),
});

therapistEarningDocs.get('/summary', {
  summary: 'Get Earnings Summary',
  success: success(200),
});

therapistEarningDocs.get('/:sessionId', {
  summary: 'Get Earnings By Session',
  params: ParamsObjectIdSchema,
  success: success(200),
});
