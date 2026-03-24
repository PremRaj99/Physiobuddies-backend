import { Router } from 'express';
import treatmentSessionAssessmentController from './treatmentSessionAssessment.controller';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
export const treatmentSessionAssessmentRouter = Router();

treatmentSessionAssessmentRouter.use(verifyJWT);

treatmentSessionAssessmentRouter.get(
  '/:id/assessment',
  treatmentSessionAssessmentController.getAssessment,
);

treatmentSessionAssessmentRouter.use(TherapistOnly);

treatmentSessionAssessmentRouter.post(
  '/:id/assessment',
  treatmentSessionAssessmentController.createOrUpdateAssessment,
);
