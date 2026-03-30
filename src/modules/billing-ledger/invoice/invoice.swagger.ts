import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const invoiceDocs = swaggerRouter('/invoice', ['Invoice']);

invoiceDocs.get('/:id', {
  summary: 'Get Invoice By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});
