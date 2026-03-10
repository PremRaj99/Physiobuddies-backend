import { Router } from 'express';
import sessionController from './session.controller';

export const sessionRouter = Router();

sessionRouter.post('/:id/start', sessionController.startSession);
sessionRouter.post('/:id/complete', sessionController.completeSession);
sessionRouter.post('/:id/no-show', sessionController.markNoShow);
sessionRouter.post('/:id/cancel', sessionController.cancelSession);
