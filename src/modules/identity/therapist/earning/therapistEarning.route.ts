import { Router } from 'express';
import therapistEarningController from './therapistEarning.controller';

export const therapistEarningRouter = Router();

therapistEarningRouter.get('/', therapistEarningController.getEarnings);
therapistEarningRouter.get('/summary', therapistEarningController.getEarningsSummary);
therapistEarningRouter.get('/:sessionId', therapistEarningController.getEarningsBySession);
