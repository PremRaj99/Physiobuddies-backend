import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { NextFunction, Request, Response } from 'express';
import adminCouponService from './adminCoupon.service';
import { createCouponSchema, updateCouponSchema } from './adminCoupon.types';

class AdminCouponController {
  getAllCoupons = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const coupons = await adminCouponService.getAllCoupons();
    return new OkResponse(coupons).send(res);
  });

  createCoupon = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const couponData = validateSchema(createCouponSchema, req.body);
    await adminCouponService.createCoupon(couponData);
    return new CreatedResponse('Coupon created successfully').send(res);
  });

  updateCoupon = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const couponId = validateSchema(ObjectIdSchema, req.params.id);
    const updateData = validateSchema(updateCouponSchema, req.body); // Allow partial updates
    await adminCouponService.updateCoupon(couponId, updateData);
    return new AcceptedResponse('Coupon updated successfully').send(res);
  });

  deleteCoupon = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const couponId = validateSchema(ObjectIdSchema, req.params.id);
    await adminCouponService.deleteCoupon(couponId);
    return new AcceptedResponse('Coupon deleted successfully').send(res);
  });
}

export default new AdminCouponController();
