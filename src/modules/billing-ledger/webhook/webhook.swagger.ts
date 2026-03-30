import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const webhookDocs = swaggerRouter('/webhook', ['Webhook']);

webhookDocs.post('/payments', {
  summary: 'Handle Payment Webhook',
  success: success(202),
});
