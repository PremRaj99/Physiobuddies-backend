import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const paymentDocs = swaggerRouter('/payment', ['Payment']);

paymentDocs.post('/create-intent', {
  summary: 'Create Payment Order',
  success: success(201),
});

paymentDocs.post('/confirm', {
  summary: 'Verify Payment',
  success: success(202),
});

paymentDocs.get('/', {
  summary: 'Get Payments',
  success: success(200),
});

paymentDocs.get('/:id', {
  summary: 'Get Payment By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});
