import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import therapistEarningService from './therapistEarning.service';
import { OkResponse } from '@/core/response/ApiResponse';
import { isAuth } from '@/core/middlewares/isAuth';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '../../auth/auth.type';

class TherapistEarningController {
  getEarnings = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const earnings = await therapistEarningService.getEarnings(userId);
    return new OkResponse(earnings).send(res);
  });

  getEarningsSummary = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const summary = await therapistEarningService.getEarningsSummary(userId);
    return new OkResponse(summary).send(res);
  });

  getEarningsBySession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const userId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const sessionId = validateSchema(ObjectIdSchema, req.params.sessionId); // Validate session ID from request parameters
    const earnings = await therapistEarningService.getEarningsBySession(userId, sessionId);
    return new OkResponse(earnings).send(res);
  });
}

export default new TherapistEarningController();
