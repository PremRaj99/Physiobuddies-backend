import { Router } from 'express';
import adminTreatmentPlanController from './adminTreatmentPlan.controller';

export const adminTreatmentPlanRouter = Router();

adminTreatmentPlanRouter.get('/', adminTreatmentPlanController.getAllTreatmentPlans);
adminTreatmentPlanRouter.get('/:id', adminTreatmentPlanController.getTreatmentPlanById);
