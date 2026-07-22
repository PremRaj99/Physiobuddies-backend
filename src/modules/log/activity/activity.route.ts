import { Router } from 'express';
import { activityController } from './activity.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const activityRouter = Router();

activityRouter.use(verifyJWT);

activityRouter.get('/', activityController.getUserActivities);
