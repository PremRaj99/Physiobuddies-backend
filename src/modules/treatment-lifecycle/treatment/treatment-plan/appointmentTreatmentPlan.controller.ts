import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import appointmentTreatmentPlanService from './appointmentTreatmentPlan.service';
import { AcceptedResponse } from '@/core/response/ApiResponse';

class AppointmentTreatmentPlanController {
  createOrUpdateTreatmentPlan = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const treatmentPlanId = req.params.id;
      const treatmentPlanData = req.body;
      await appointmentTreatmentPlanService.createOrUpdateTreatmentPlan(
        treatmentPlanId as string,
        treatmentPlanData,
      );
      return new AcceptedResponse('Treatment plan created or updated successfully').send(res);
    },
  );

  addSessionToTreatmentPlan = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const treatmentPlanId = req.params.id;
      const { sessionId } = req.body;
      await appointmentTreatmentPlanService.addSessionToTreatmentPlan(
        treatmentPlanId as string,
        sessionId,
      );
      return new AcceptedResponse('Session added to treatment plan successfully').send(res);
    },
  );
}

export default new AppointmentTreatmentPlanController();
