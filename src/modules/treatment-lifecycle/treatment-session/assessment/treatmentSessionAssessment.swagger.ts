import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const assessmentDocs = swaggerRouter('/treatment-session', [
  'Treatment Session Clinical Assessment',
]);

assessmentDocs.get('/:id/assessment', {
  summary: 'Get Session Clinical Assessment',
  success: success(200),
  errors: [404],
});

assessmentDocs.post('/:id/assessment', {
  summary: 'Create or Update Clinical Assessment',
  success: success(200),
});
