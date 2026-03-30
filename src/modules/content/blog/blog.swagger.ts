import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const blogDocs = swaggerRouter('/blog', ['Blog']);

blogDocs.get('/', {
  summary: 'Get All Blogs',
  success: success(200),
});

blogDocs.get('/:slug', {
  summary: 'Get Blog By Slug',
  success: success(200),
});

blogDocs.post('/:id/like', {
  summary: 'Like/ Unlike Blog',
  success: success(202),
});

blogDocs.post('/:id/review', {
  summary: 'Create Review',
  success: success(201),
});

blogDocs.post('/', {
  summary: 'Create Blog',
  success: success(201),
});

blogDocs.get('/admin/all', {
  summary: 'Get All Blogs For Admin',
  success: success(201),
});

blogDocs.put('/admin/:id', {
  summary: 'Update Blog',
  params: ParamsObjectIdSchema,
  success: success(202),
});

blogDocs.delete('/:id', {
  summary: 'Delete Blog',
  params: ParamsObjectIdSchema,
  success: success(202),
});
