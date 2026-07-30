import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const userSessionDocs = swaggerRouter('/user/sessions', ['User Sessions']);

userSessionDocs.get('/', {
  summary: 'Get Active User Sessions',
  description: 'Retrieve all active authentication sessions for current user.',
  success: success(200),
});

userSessionDocs.delete('/:id', {
  summary: 'Revoke User Session',
  description: 'Revoke a specific login session by ID.',
  success: success(200),
  errors: [404],
});
