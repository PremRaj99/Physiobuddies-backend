import { Router } from 'express';
import therapistFaqController from './therapistFaq.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistFaqRouter = Router();

therapistFaqRouter.use(verifyJWT);
therapistFaqRouter.use(TherapistOnly);

therapistFaqRouter.post('/', therapistFaqController.createFaq);
therapistFaqRouter.patch('/:id', therapistFaqController.updateFaq);
therapistFaqRouter.delete('/:id', therapistFaqController.deleteFaq);
