import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const cronDocs = swaggerRouter('/cron', ['Cron Job']);

cronDocs.post('/expire-reservations', {
  summary: 'Expire Reservations',
  success: success(202),
});

cronDocs.post('/mark-no-show', {
  summary: 'Mark Treatment as No Show',
  success: success(202),
});

cronDocs.post('/settle-sessions', {
  summary: 'Settle Sessions',
  success: success(202),
});
