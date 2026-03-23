import { Response, Request, NextFunction } from 'express';
import adminTherapistService from './adminTherapist.service';
import { asyncHandler } from '@/core/response/responseHandler';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { UpdateCommissionRateSchema } from './adminTherapist.types';

class AdminTherapistController {
  getAllTherapists = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const therapists = await adminTherapistService.getAllTherapists();
    return new OkResponse(therapists).send(res);
  });

  verifyTherapist = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    await adminTherapistService.verifyTherapist(therapistId);
    return new AcceptedResponse('Therapist verified successfully').send(res);
  });

  updateCommissionRate = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const parseData = validateSchema(UpdateCommissionRateSchema, req.body);
    await adminTherapistService.updateCommissionRate(therapistId, parseData);
    return new AcceptedResponse('Commission rate updated successfully').send(res);
  });
}

export default new AdminTherapistController();
