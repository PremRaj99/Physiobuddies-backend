import { Router } from 'express';
import { adminController } from './admin.controller';

export const adminRouter = Router();

adminRouter.get('/dashboard', adminController.getDashboard);

adminRouter.get('/payments', adminController.getAllPayments);
adminRouter.get('/commissions', adminController.getAllCommissions);
adminRouter.get('/payouts', adminController.getAllPayouts);

adminRouter.post('/payouts/:id/process', adminController.processPayout);
adminRouter.post('/refunds/:sessionId', adminController.processRefund);
