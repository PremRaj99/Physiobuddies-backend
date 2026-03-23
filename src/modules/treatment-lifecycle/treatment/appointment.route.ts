import { Router } from 'express';
import { appointmentController } from './appointment.controller';

export const appointmentRouter = Router();

appointmentRouter.post('/', appointmentController.createTreatmentPlan);
appointmentRouter.get('/', appointmentController.listTreatmentPlans);
appointmentRouter.get('/:id', appointmentController.getTreatmentPlanById);
appointmentRouter.patch('/:id/cancel', appointmentController.cancelTreatmentPlan);
