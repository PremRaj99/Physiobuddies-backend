import { Router } from 'express';
import therapistPayoutController from './therapistPayout.controller';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const therapistPayoutRouter = Router();

therapistPayoutRouter.use(verifyJWT);
therapistPayoutRouter.use(TherapistOnly);

therapistPayoutRouter.post('/request', therapistPayoutController.requestPayout);
therapistPayoutRouter.get('/', therapistPayoutController.getPayouts);
therapistPayoutRouter.get('/:id', therapistPayoutController.getPayoutById);
