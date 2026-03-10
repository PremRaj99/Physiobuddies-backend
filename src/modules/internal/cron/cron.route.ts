import { Router } from 'express';
import cronController from './cron.controller';

export const cronRouter = Router();

cronRouter.post('/expire-reservations', cronController.expireReservations);
cronRouter.post('/mark-no-show', cronController.markNoShow);
cronRouter.post('/settle-sessions', cronController.settleSessions);
