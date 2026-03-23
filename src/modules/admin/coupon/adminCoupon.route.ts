import { Router } from 'express';
import adminCouponController from './adminCoupon.controller';

export const adminCouponRouter = Router();

adminCouponRouter.get('/', adminCouponController.getAllCoupons);
adminCouponRouter.post('/', adminCouponController.createCoupon);
adminCouponRouter.patch('/:id', adminCouponController.updateCoupon);
adminCouponRouter.delete('/:id', adminCouponController.deleteCoupon);
