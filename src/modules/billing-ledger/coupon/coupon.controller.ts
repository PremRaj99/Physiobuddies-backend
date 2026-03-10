import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import { OkResponse, AcceptedResponse } from '@/core/response/ApiResponse';

class CouponController {
  applyCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Logic to apply a coupon to a user's account or order
    res.json(new AcceptedResponse('Coupon applied successfully'));
  });

  getAvailableCoupons = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Logic to retrieve available coupons for the user
    res.json(new OkResponse({ coupons: [] })); // Return an array of available coupons
  });
}

export const couponController = new CouponController();
