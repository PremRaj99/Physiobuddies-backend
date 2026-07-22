import { Router } from 'express';
import { userSessionController } from './userSession.controller';

export const userSessionRouter = Router();

userSessionRouter.get('/', userSessionController.getSessions);
userSessionRouter.delete('/:id', userSessionController.revokeSession);
