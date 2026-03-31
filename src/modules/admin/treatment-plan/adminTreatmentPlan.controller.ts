import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import adminTreatmentPlanService from './adminTreatmentPlan.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class AdminTreatmentPlanController {
  getAllTreatmentPlans = asyncHandler(async (_req, res, _next) => {
    const treatmentPlans = await adminTreatmentPlanService.getAllTreatmentPlans();
    return new OkResponse(treatmentPlans).send(res);
  });

  getTreatmentPlanById = asyncHandler(async (req, res, _next) => {
    const treatmentPlanId = validateSchema(ObjectIdSchema, req.params.treatmentPlanId);
    const treatmentPlan = await adminTreatmentPlanService.getTreatmentPlanById(treatmentPlanId);
    return new OkResponse(treatmentPlan).send(res);
  });
}

export default new AdminTreatmentPlanController();
