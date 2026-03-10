import { asyncHandler } from '@/core/response/responseHandler';
import { therapistSessionService } from './therapistSession.service';
import { Request, Response, NextFunction } from 'express';
import { OkResponse } from '@/core/response/ApiResponse';

class TherapistSessionController {
  getTodaySessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.params.therapistId;
    const todaySessions = await therapistSessionService.getTodaySessions(therapistId);
    res.json(new OkResponse(todaySessions));
  });

  getUpcomingSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = req.params.therapistId;
    const upcomingSessions = await therapistSessionService.getUpcomingSessions(therapistId);
    res.json(new OkResponse(upcomingSessions));
  });
}

export default new TherapistSessionController();
