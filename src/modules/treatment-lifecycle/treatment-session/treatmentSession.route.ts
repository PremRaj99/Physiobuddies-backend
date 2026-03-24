import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { Router } from 'express';
import { treatmentSessionReviewRouter } from './review/treatmentSessionReview.route';
import treatmentSessionController from './treatmentSession.controller';
import { treatmentSessionAssessmentRouter } from './assessment/treatmentSessionAssessment.route';

export const treatmentSessionRouter = Router();

treatmentSessionRouter.use(verifyJWT);

treatmentSessionRouter.use('/', treatmentSessionReviewRouter);
treatmentSessionRouter.use('/', treatmentSessionAssessmentRouter);

treatmentSessionRouter.post('/:id/start', treatmentSessionController.startSession);
treatmentSessionRouter.post('/:id/complete', treatmentSessionController.completeSession);
treatmentSessionRouter.post('/:id/no-show', treatmentSessionController.markNoShow);
treatmentSessionRouter.post('/:id/cancel', treatmentSessionController.cancelSession);
