import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { PatientDetailsSchema, UpdatePatientDetailsSchema } from '../patient.type';

const patientDetailsDocs = swaggerRouter('/patient/details', ['Patient Details']);

patientDetailsDocs.post('/', {
  summary: 'Create Patient Detail',
  body: PatientDetailsSchema,
  success: success(201),
});

patientDetailsDocs.get('/', {
  summary: 'Get Patient Details',
  success: success(200),
});

patientDetailsDocs.patch('/:id', {
  summary: 'Update Patient Detail',
  body: UpdatePatientDetailsSchema,
  params: ParamsObjectIdSchema,
  success: success(202),
});

patientDetailsDocs.delete('/:id', {
  summary: 'Delete Patient Detail',
  params: ParamsObjectIdSchema,
  success: success(202),
});
