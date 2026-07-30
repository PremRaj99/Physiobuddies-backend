import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const activityDocs = swaggerRouter('/activity', ['Activity Log']);

activityDocs.get('/', {
  summary: 'Get Activity Logs',
  description: 'Retrieve user or admin activity logs.',
  success: success(200),
});
