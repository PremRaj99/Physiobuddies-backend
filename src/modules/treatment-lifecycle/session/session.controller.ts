import { asyncHandler } from '@/core/response/responseHandler';
import sessionService from './session.service';
import { Request, Response, NextFunction } from 'express';
import { AcceptedResponse } from '@/core/response/ApiResponse';

class SessionController {
  startSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = req.params.id;
    await sessionService.startSession(sessionId);
    res.json(new AcceptedResponse());
  });
  completeSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = req.params.id;
    await sessionService.completeSession(sessionId);
    res.json(new AcceptedResponse());
  });

  markNoShow = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = req.params.id;
    await sessionService.markNoShow(sessionId);
    res.json(new AcceptedResponse());
  });

  cancelSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = req.params.id;
    await sessionService.cancelSession(sessionId);
    res.json(new AcceptedResponse());
  });
}

export default new SessionController();
