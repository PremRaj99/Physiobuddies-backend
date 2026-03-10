import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import therapistPayoutService from './therapistPayout.service';
import { OkResponse, AcceptedResponse } from '@/core/response/ApiResponse';

class TherapistPayoutController {
  requestPayout = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.user.id;
    const { amount, paymentMethod } = req.body;
    await therapistPayoutService.requestPayout(therapistId, amount, paymentMethod);
    res.json(new AcceptedResponse());
  });

  getPayouts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.user.id;
    const payouts = await therapistPayoutService.getPayouts(therapistId);
    res.json(new OkResponse(payouts));
  });

  getPayoutById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const payoutId = req.params.id;
    const payout = await therapistPayoutService.getPayoutById(payoutId);
    res.json(new OkResponse(payout));
  });
}

export default new TherapistPayoutController();
