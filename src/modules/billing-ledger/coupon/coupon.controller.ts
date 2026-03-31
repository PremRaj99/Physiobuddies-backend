import { asyncHandler } from '@/core/response/responseHandler';
import { OkResponse, AcceptedResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ApplyCouponRequestSchema } from './coupon.type';
import { couponService } from './coupon.service';
import { isAuth } from '@/core/middlewares/isAuth';

class CouponController {
  applyCoupon = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const parseData = validateSchema(ApplyCouponRequestSchema, req.body);
    const userId = req.user.id;
    await couponService.applyCoupon(parseData, userId);
    return new AcceptedResponse('Coupon applied successfully').send(res);
  });

  getAvailableCoupons = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const userId = req.user.id;
    const coupons = await couponService.getAvailableCoupons(userId);
    return new OkResponse(coupons).send(res);
  });
}

export const couponController = new CouponController();
