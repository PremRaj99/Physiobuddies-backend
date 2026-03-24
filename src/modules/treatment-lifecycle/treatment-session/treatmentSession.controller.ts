import { asyncHandler } from '@/core/response/responseHandler';
import sessionService from './treatmentSession.service';
import { Request, Response, NextFunction } from 'express';
import { AcceptedResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class TreatmentSessionController {
  startSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.startSession(sessionId);
    return new AcceptedResponse('Session started successfully').send(res);
  });
  completeSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.completeSession(sessionId);
    return new AcceptedResponse('Session completed successfully').send(res);
  });

  markNoShow = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.markNoShow(sessionId);
    return new AcceptedResponse('Session marked as no-show successfully').send(res);
  });

  cancelSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.cancelSession(sessionId);
    return new AcceptedResponse('Session canceled successfully').send(res);
  });
}

export default new TreatmentSessionController();
