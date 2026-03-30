import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const TherapistRegistrationDocs = swaggerRouter('/therapist-registration', [
  'Therapist Registration',
]);

TherapistRegistrationDocs.post('/', {
  summary: 'Submit Registration',
  success: success(201),
});

TherapistRegistrationDocs.get('/', {
  summary: 'Get All Registration',
  success: success(200),
});

TherapistRegistrationDocs.get('/:id', {
  summary: 'Get Registration By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});

TherapistRegistrationDocs.patch('/:id/status', {
  summary: 'Update Registration Status',
  params: ParamsObjectIdSchema,
  success: success(202),
});

TherapistRegistrationDocs.post('/:id/approve', {
  summary: 'Approve Registration',
  params: ParamsObjectIdSchema,
  success: success(202),
});

TherapistRegistrationDocs.post('/:id/reject', {
  summary: 'Reject Registration',
  params: ParamsObjectIdSchema,
  success: success(202),
});
