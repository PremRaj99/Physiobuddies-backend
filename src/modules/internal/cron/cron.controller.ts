import { AcceptedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { NextFunction, Request, Response } from 'express';

export class CronController {
  expireReservations = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to expire reservations
    return new AcceptedResponse('Reservations expired successfully').send(res);
  });

  markNoShow = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to mark no-shows
    return new AcceptedResponse('No-shows marked successfully').send(res);
  });

  settleSessions = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to settle sessions
    return new AcceptedResponse('Sessions settled successfully').send(res);
  });
}

export default new CronController();
