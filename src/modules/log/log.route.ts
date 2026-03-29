import { Router } from 'express';
import { getAllLogs } from './log.controller';

export const logRouter = Router();

logRouter.get('/', getAllLogs);
