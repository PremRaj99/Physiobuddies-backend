import { AcceptedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { NextFunction, Request, Response } from 'express';

export class CronController {
  expireReservations = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to expire reservations
    res.json(new AcceptedResponse('Reservations expired successfully'));
  });

  markNoShow = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to mark no-shows
    res.json(new AcceptedResponse('No-shows marked successfully'));
  });

  settleSessions = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to settle sessions
    res.json(new AcceptedResponse('Sessions settled successfully'));
  });
}

export default new CronController();
