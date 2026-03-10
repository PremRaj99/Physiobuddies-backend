import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import appointmentTreatmentPlanService from './appointmentTreatmentPlan.service';
import { AcceptedResponse } from '@/core/response/ApiResponse';

class AppointmentTreatmentPlanController {
  createOrUpdateTreatmentPlan = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const appointmentId = req.params.id;
      const treatmentPlanData = req.body;
      await appointmentTreatmentPlanService.createOrUpdateTreatmentPlan(
        appointmentId,
        treatmentPlanData,
      );
      res.json(new AcceptedResponse());
    },
  );

  addSessionToTreatmentPlan = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const appointmentId = req.params.id;
      const { sessionId } = req.body;
      await appointmentTreatmentPlanService.addSessionToTreatmentPlan(appointmentId, sessionId);
      res.json(new AcceptedResponse());
    },
  );
}

export default new AppointmentTreatmentPlanController();
