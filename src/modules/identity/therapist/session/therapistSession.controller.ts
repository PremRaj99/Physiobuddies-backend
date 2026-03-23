import { asyncHandler } from '@/core/response/responseHandler';
import { therapistSessionService } from './therapistSession.service';
import { Request, Response, NextFunction } from 'express';
import { OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '../../auth/auth.type';

class TherapistSessionController {
  getTodaySessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = validateSchema(ObjectIdSchema, req.params.therapistId);
    const todaySessions = await therapistSessionService.getTodaySessions(therapistId);
    return new OkResponse(todaySessions).send(res);
  });

  getUpcomingSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = validateSchema(ObjectIdSchema, req.params.therapistId);
    const upcomingSessions = await therapistSessionService.getUpcomingSessions(therapistId);
    return new OkResponse(upcomingSessions).send(res);
  });
}

export default new TherapistSessionController();
