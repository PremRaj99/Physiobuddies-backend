import { Router } from 'express';
import therapistEarningController from './therapistEarning.controller';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const therapistEarningRouter = Router();

therapistEarningRouter.use(verifyJWT);
therapistEarningRouter.use(TherapistOnly);

therapistEarningRouter.get('/', therapistEarningController.getEarnings);
therapistEarningRouter.get('/summary', therapistEarningController.getEarningsSummary);
therapistEarningRouter.get('/:sessionId', therapistEarningController.getEarningsBySession);
