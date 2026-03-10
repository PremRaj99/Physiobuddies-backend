import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import therapistEarningService from './therapistEarning.service';
import { OkResponse } from '@/core/response/ApiResponse';

class TherapistEarningController {
  getEarnings = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const earnings = await therapistEarningService.getEarnings(therapistId);
    res.json(new OkResponse(earnings));
  });

  getEarningsSummary = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const summary = await therapistEarningService.getEarningsSummary(therapistId);
    res.json(new OkResponse(summary));
  });

  getEarningsBySession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const sessionId = req.params.sessionId;
    const earnings = await therapistEarningService.getEarningsBySession(therapistId, sessionId);
    res.json(new OkResponse(earnings));
  });
}

export default new TherapistEarningController();
