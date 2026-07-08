import { Router } from 'express';
import therapistLeaveController from './therapistLeave.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistLeaveRouter = Router();

therapistLeaveRouter.use(verifyJWT);
therapistLeaveRouter.use(TherapistOnly);

therapistLeaveRouter.post('/', therapistLeaveController.applyLeave);
