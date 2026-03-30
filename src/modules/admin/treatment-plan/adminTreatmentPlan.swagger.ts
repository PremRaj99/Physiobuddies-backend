import { success, swaggerRouter } from '@/core/api-docs/swagger.router';
import { ParamsObjectIdSchema } from '@/modules/identity/auth/auth.type';

const adminTreatmentPlansDocs = swaggerRouter('/admin/treatment-plan', ['Admin Treatment Plans']);

adminTreatmentPlansDocs.get('/', {
  summary: 'Get All Treatment Plans',
  success: success(200),
});

adminTreatmentPlansDocs.get('/:id', {
  summary: 'Get Treatment Plans By Id',
  params: ParamsObjectIdSchema,
  success: success(200),
});
