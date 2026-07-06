import { AcceptedResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { SubmitFinalOnboardingSchema, SubmitOnboardingSchema } from './therapistMeta.type';
import { therapistMetaService } from './therapistMeta.service';
import { NextFunction, Request, Response } from 'express';
import { isAuth } from '@/core/middlewares/isAuth';

class TherapistMetaController {
  async submitOnboarding(req: Request, res: Response, _next: NextFunction) {
    isAuth(req);
    const userId = req.user.id;
    const data = validateSchema(SubmitOnboardingSchema, req.body);
    await therapistMetaService.submitOnboarding(userId, data);

    return new AcceptedResponse('Onboarding profile submitted successfully.').send(res);
  }

  async submitFinalOnboarding(req: Request, res: Response, _next: NextFunction) {
    isAuth(req);
    const userId = req.user.id;
    const data = validateSchema(SubmitFinalOnboardingSchema, req.body);
    await therapistMetaService.submitFinalOnboarding(userId, data);

    return new AcceptedResponse('Final onboarding profile submitted successfully.').send(res);
  }
}

export const therapistMetaController = new TherapistMetaController();
