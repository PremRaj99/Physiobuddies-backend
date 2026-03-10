import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { Router } from 'express';
import { patientController } from './patient.controller';
import { patientDetailController } from './patient-detail/patient-detail.controller';
import { patientLocationController } from './patient-location/patient-location.controller';

export const patientRouter = Router();
export const patientDetailsRouter = Router();
export const patientLocationRouter = Router();

patientRouter.use(verifyJWT);
patientRouter.get('/info', patientController.patientInfo);

patientRouter.use('/details', patientDetailsRouter);
patientRouter.use('/location', patientLocationRouter);

patientDetailsRouter.post('/', patientDetailController.createPatientDetail);
patientDetailsRouter.get('/', patientDetailController.getPatientDetails);
patientDetailsRouter.patch('/:id', patientDetailController.updatePatientDetail);
patientDetailsRouter.delete('/:id', patientDetailController.deletePatientDetail);

patientLocationRouter.post('/', patientLocationController.createPatientLocation);
patientLocationRouter.get('/', patientLocationController.getPatientLocations);
patientLocationRouter.patch('/:id', patientLocationController.updatePatientLocation);
patientLocationRouter.delete('/:id', patientLocationController.deletePatientLocation);
