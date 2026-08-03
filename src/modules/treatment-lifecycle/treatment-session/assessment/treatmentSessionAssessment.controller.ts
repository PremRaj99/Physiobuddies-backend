import { asyncHandler } from '@/core/response/responseHandler';
import sessionAssessmentService from './treatmentSessionAssessment.service';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class TreatmentSessionAssessmentController {
  getAssessment = asyncHandler(async (req, res, _next) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const assessment = await sessionAssessmentService.getAssessment(sessionId);
    return new OkResponse(assessment).send(res);
  });

  createOrUpdateAssessment = asyncHandler(async (req, res, _next) => {
    try {
      const sessionId = validateSchema(ObjectIdSchema, req.params.id);
      const assessmentData = req.body;
      console.log('[Assessment POST] sessionId:', sessionId);
      await sessionAssessmentService.createOrUpdateAssessment(sessionId, assessmentData);
      return new AcceptedResponse('Assessment created or updated successfully').send(res);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Assessment POST ERROR]:', error?.message || err);
      console.error(error?.stack || err);
      throw err;
    }
  });
}

export default new TreatmentSessionAssessmentController();
