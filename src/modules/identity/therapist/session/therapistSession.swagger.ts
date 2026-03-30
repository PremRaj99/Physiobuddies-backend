import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const therapistSessionDocs = swaggerRouter('/therapist/sessions', ['Therapist Session']);

therapistSessionDocs.get('/today', {
  summary: 'Get Today Session',
  success: success(200),
});

therapistSessionDocs.get('/upcomming', {
  summary: 'Get Upcomming Session',
  success: success(200),
});
