import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { UpdateCommissionRateSchema } from './adminTherapist.types';

const adminTherapistDocs = swaggerRouter('/admin/therapist', ['Admin Therapist']);

adminTherapistDocs.get('/', {
  summary: 'Get All Therapists',
  success: success(200),
});

adminTherapistDocs.patch('/:id/verify', {
  summary: 'Verify Therapist',
  params: ParamsObjectIdSchema,
  success: success(202),
});

adminTherapistDocs.patch('/:id/commission-rate', {
  summary: 'Update Commission Rate',
  params: ParamsObjectIdSchema,
  body: UpdateCommissionRateSchema,
  success: success(202),
});
