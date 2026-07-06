import { Router } from 'express';
import { therapistMetaController } from './therapistMeta.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistMetaRouter = Router();

therapistMetaRouter.use(verifyJWT);
therapistMetaRouter.use(TherapistOnly);

therapistMetaRouter.post('/onboarding', therapistMetaController.submitOnboarding);
therapistMetaRouter.post('/onboarding/final', therapistMetaController.submitFinalOnboarding);
