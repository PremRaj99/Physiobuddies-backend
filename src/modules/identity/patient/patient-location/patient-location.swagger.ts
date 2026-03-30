import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { PatientLocationSchema, UpdatePatientLocationSchema } from '../patient.type';

const patientLocationDocs = swaggerRouter('/patient/location', ['Patient Location']);

patientLocationDocs.post('/', {
  summary: 'Create Patient Location',
  body: PatientLocationSchema,
  success: success(201),
});

patientLocationDocs.get('/', {
  summary: 'Get Patient Locations',
  success: success(200),
});

patientLocationDocs.patch('/:id', {
  summary: 'Update Patient Location',
  body: UpdatePatientLocationSchema,
  params: ParamsObjectIdSchema,
  success: success(202),
});

patientLocationDocs.delete('/:id', {
  summary: 'Delete Patient Location',
  params: ParamsObjectIdSchema,
  success: success(202),
});
