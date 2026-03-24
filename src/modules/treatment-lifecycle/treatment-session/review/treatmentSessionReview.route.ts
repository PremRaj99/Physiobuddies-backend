import { Router } from 'express';
import treatmentSessionReviewController from './treatmentSessionReview.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const treatmentSessionReviewRouter = Router();

treatmentSessionReviewRouter.use(verifyJWT);

treatmentSessionReviewRouter.post('/:id/review', treatmentSessionReviewController.submitReview);
treatmentSessionReviewRouter.get('/:id/reviews', treatmentSessionReviewController.getReviews);
