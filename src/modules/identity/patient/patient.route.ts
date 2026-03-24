import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { Router } from 'express';
import { patientController } from './patient.controller';
import { patientDetailsRouter } from './patient-detail/patient-detail.route';
import { patientLocationRouter } from './patient-location/patient-location.route';

export const patientRouter = Router();

patientRouter.use(verifyJWT);
patientRouter.get('/info', patientController.patientInfo);

patientRouter.use('/details', patientDetailsRouter);
patientRouter.use('/location', patientLocationRouter);
