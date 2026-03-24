import { Router } from 'express';
import appointmentTreatmentPlanController from './appointmentTreatmentPlan.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const appointmentTreatmentPlanRouter = Router();

appointmentTreatmentPlanRouter.use(verifyJWT);

appointmentTreatmentPlanRouter.post(
  '/:id/plan',
  appointmentTreatmentPlanController.createOrUpdateTreatmentPlan,
);
appointmentTreatmentPlanRouter.post(
  '/:id/add-session',
  appointmentTreatmentPlanController.addSessionToTreatmentPlan,
);
