import { Router } from 'express';
import therapistPayoutController from './therapistPayout.controller';

export const therapistPayoutRouter = Router();

therapistPayoutRouter.post('/request', therapistPayoutController.requestPayout);
therapistPayoutRouter.get('/', therapistPayoutController.getPayouts);
therapistPayoutRouter.get('/:id', therapistPayoutController.getPayoutById);
