import { Router } from 'express';
import { therapistController } from './therapist.controller';

export const therapistRouter = Router();

therapistRouter.get('/', therapistController.getAllTherapists);
therapistRouter.get('/:id', therapistController.getTherapistById);
therapistRouter.get('/:id/reviews', therapistController.getTherapistReviews);
therapistRouter.get('/:id/articles', therapistController.getTherapistArticles);
therapistRouter.get('/:id/availability', therapistController.getTherapistAvailability);
