import { Router } from 'express';
import { adminController } from './admin.controller';
import { adminTreatmentPlanRouter } from './treatment-plan/adminTreatmentPlan.route';
import { adminCouponRouter } from './coupon/adminCoupon.route';
import { adminTherapistRouter } from './therapist/adminTherapist.route';
import { adminUserRouter } from './user/adminUser.route';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { AdminOnly } from '@/core/middlewares/verifyAdmin';

export const adminRouter = Router();

adminRouter.use(verifyJWT);
adminRouter.use(AdminOnly);

adminRouter.use('/treatment-plan', adminTreatmentPlanRouter);
adminRouter.use('/coupon', adminCouponRouter);
adminRouter.use('/therapist', adminTherapistRouter);
adminRouter.use('/users', adminUserRouter);

adminRouter.get('/dashboard', adminController.getDashboard);

adminRouter.get('/payments', adminController.getAllPayments);
adminRouter.get('/commissions', adminController.getAllCommissions);
adminRouter.get('/payouts', adminController.getAllPayouts);

adminRouter.post('/payouts/:id/process', adminController.processPayout);
adminRouter.post('/refunds/:sessionId', adminController.processRefund);
