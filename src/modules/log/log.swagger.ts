import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const logDocs = swaggerRouter('/logs', ['Logs']);

logDocs.get('/', {
  summary: 'Get Server Logs',
  description: 'Retrieve combined system server logs.',
  success: success(200),
});
