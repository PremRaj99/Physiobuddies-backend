import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const contactDocs = swaggerRouter('/contact', ['Contact']);

contactDocs.post('/', {
  summary: 'Submit Contact Form',
  success: success(201),
});

contactDocs.get('/', {
  summary: 'Get All Contacts',
  success: success(200),
});

contactDocs.get('/:id', {
  summary: 'Get Contact By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});

contactDocs.patch('/:id/status', {
  summary: 'Update Avatar',
  params: ParamsObjectIdSchema,
  success: success(202),
});
