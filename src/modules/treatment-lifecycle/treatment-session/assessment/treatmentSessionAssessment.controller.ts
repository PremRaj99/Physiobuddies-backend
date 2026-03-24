import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import sessionAssessmentService from './treatmentSessionAssessment.service';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class TreatmentSessionAssessmentController {
  getAssessment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const assessment = await sessionAssessmentService.getAssessment(sessionId);
    return new OkResponse(assessment).send(res);
  });

  createOrUpdateAssessment = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const sessionId = validateSchema(ObjectIdSchema, req.params.id);
      const assessmentData = req.body;
      await sessionAssessmentService.createOrUpdateAssessment(sessionId, assessmentData);
      return new AcceptedResponse('Assessment created or updated successfully').send(res);
    },
  );
}

export default new TreatmentSessionAssessmentController();
