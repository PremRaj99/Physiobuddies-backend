import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const patientDocs = swaggerRouter('/patient', ['Patient']);

patientDocs.get('/info', {
  summary: 'Patient Info',
  success: success(200),
});
