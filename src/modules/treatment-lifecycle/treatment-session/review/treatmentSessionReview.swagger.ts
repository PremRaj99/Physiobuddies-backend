import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const reviewDocs = swaggerRouter('/treatment-session', ['Treatment Session Reviews']);

reviewDocs.post('/:id/review', {
  summary: 'Submit Session Review',
  success: success(201),
});

reviewDocs.get('/:id/reviews', {
  summary: 'Get Session Reviews',
  success: success(200),
});
