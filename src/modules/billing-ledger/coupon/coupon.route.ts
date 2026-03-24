import { Router } from 'express';
import { couponController } from './coupon.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const couponRouter = Router();

couponRouter.use(verifyJWT);
couponRouter.post('/apply', couponController.applyCoupon);
couponRouter.get('/available', couponController.getAvailableCoupons);
