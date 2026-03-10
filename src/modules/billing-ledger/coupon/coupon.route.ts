import { Router } from 'express';
import { couponController } from './coupon.controller';

export const couponRouter = Router();

couponRouter.post('/apply', couponController.applyCoupon);
couponRouter.get('/available', couponController.getAvailableCoupons);
