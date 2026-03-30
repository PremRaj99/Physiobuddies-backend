import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { RequestPayoutSchema } from './therapistPayout.types';

const therapistPayoutDocs = swaggerRouter('/therapist/payout', ['Therapist Payout']);

therapistPayoutDocs.post('/request', {
  summary: 'Request Payout',
  body: RequestPayoutSchema,
  success: success(201),
});

therapistPayoutDocs.get('/', {
  summary: 'Get Payouts',
  success: success(200),
});

therapistPayoutDocs.get('/:id', {
  summary: 'Get Payout By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});
