import { Router } from 'express';
import appointmentTreatmentPlanController from './appointmentTreatmentPlan.controller';

export const appointmentTreatmentPlanRouter = Router();

appointmentTreatmentPlanRouter.post(
  '/:id/plan',
  appointmentTreatmentPlanController.createOrUpdateTreatmentPlan,
);
appointmentTreatmentPlanRouter.post(
  '/:id/add-session',
  appointmentTreatmentPlanController.addSessionToTreatmentPlan,
);
