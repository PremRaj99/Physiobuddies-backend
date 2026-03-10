import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import sessionAssessmentService from './sessionAssessment.service';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';

class SessionAssessmentController {
  getAssessment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = req.params.id;
    const assessment = await sessionAssessmentService.getAssessment(sessionId);
    res.json(new OkResponse(assessment));
  });

  createOrUpdateAssessment = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const sessionId = req.params.id;
      const assessmentData = req.body;
      await sessionAssessmentService.createOrUpdateAssessment(sessionId, assessmentData);
      res.json(new AcceptedResponse());
    },
  );
}

export default new SessionAssessmentController();
