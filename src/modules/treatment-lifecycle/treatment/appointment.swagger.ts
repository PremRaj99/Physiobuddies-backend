import { success, swaggerRouter } from '@/core/api-docs/swagger.router';

const appointmentDocs = swaggerRouter('/treatment-plan', ['Appointments & Treatment Plans']);

appointmentDocs.post('/', {
  summary: 'Create Treatment Plan',
  success: success(201),
});

appointmentDocs.get('/', {
  summary: 'List Treatment Plans',
  success: success(200),
});

appointmentDocs.get('/:id', {
  summary: 'Get Treatment Plan Details',
  success: success(200),
  errors: [404],
});

appointmentDocs.patch('/:id/cancel', {
  summary: 'Cancel Treatment Plan',
  success: success(200),
});

appointmentDocs.post('/:id/plan', {
  summary: 'Create or Update Clinical Plan Details',
  success: success(200),
});

appointmentDocs.post('/:id/add-session', {
  summary: 'Add Session to Treatment Plan',
  success: success(200),
});
