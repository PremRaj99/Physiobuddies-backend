import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const adminDocs = swaggerRouter('/admin', ['Admin']);

adminDocs.get('/dashboard', {
  summary: 'Get Dashboard',
  success: success(200),
});

adminDocs.get('/payments', {
  summary: 'Get All Payments',
  success: success(200),
});

adminDocs.get('/commissions', {
  summary: 'Get All Commissions',
  success: success(200),
});

adminDocs.get('/payouts', {
  summary: 'Get All Payouts',
  success: success(200),
});

adminDocs.post('/payouts/:id/process', {
  summary: 'Process Payout',
  params: ParamsObjectIdSchema,
  success: success(202),
});

adminDocs.post('/refunds/:sessionId', {
  summary: 'Process Refund',
  params: ParamsObjectIdSchema,
  success: success(202),
});
