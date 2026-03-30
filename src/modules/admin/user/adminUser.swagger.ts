import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const adminUserDocs = swaggerRouter('/admin/users', ['Admin User']);

adminUserDocs.get('/', {
  summary: 'Get All Users',
  success: success(200),
});

adminUserDocs.patch('/:id/block', {
  summary: 'Block User',
  params: ParamsObjectIdSchema,
  success: success(202),
});
