import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import therapistPayoutService from './therapistPayout.service';
import { OkResponse, AcceptedResponse } from '@/core/response/ApiResponse';
import { isAuth } from '@/core/middlewares/isAuth';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '../../auth/auth.type';

class TherapistPayoutController {
  requestPayout = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id;
    const { amount, paymentMethod } = req.body;
    await therapistPayoutService.requestPayout(userId, amount);
    return new AcceptedResponse('Payout requested successfully').send(res);
  });

  getPayouts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id;
    const payouts = await therapistPayoutService.getPayouts(userId);
    return new OkResponse(payouts).send(res);
  });

  getPayoutById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id;
    const payoutId = validateSchema(ObjectIdSchema, req.params.id);
    const payout = await therapistPayoutService.getPayoutById(payoutId);
    return new OkResponse(payout).send(res);
  });
}

export default new TherapistPayoutController();
