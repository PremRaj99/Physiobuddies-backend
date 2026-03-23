import { Router } from 'express';
import therapistFaqController from './therapistFaq.controller';

export const therapistFaqRouter = Router();

therapistFaqRouter.post('/', therapistFaqController.createFaq);
therapistFaqRouter.patch('/:id', therapistFaqController.updateFaq);
therapistFaqRouter.delete('/:id', therapistFaqController.deleteFaq);
