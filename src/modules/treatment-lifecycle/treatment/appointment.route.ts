import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { appointmentTreatmentPlanRouter } from './treatment-plan/appointmentTreatmentPlan.route';

export const appointmentRouter = Router();

appointmentRouter.use(verifyJWT);

appointmentRouter.use('/', appointmentTreatmentPlanRouter);

appointmentRouter.post('/', appointmentController.createTreatmentPlan);
appointmentRouter.get('/', appointmentController.listTreatmentPlans);
appointmentRouter.get('/:id', appointmentController.getTreatmentPlanById);
appointmentRouter.patch('/:id/cancel', appointmentController.cancelTreatmentPlan);
