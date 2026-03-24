import { Router } from 'express';
import { patientLocationController } from './patient-location.controller';
import { PatientOnly } from '@/core/middlewares/verifyPatient';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const patientLocationRouter = Router();

patientLocationRouter.use(verifyJWT);
patientLocationRouter.use(PatientOnly);

patientLocationRouter.post('/', patientLocationController.createPatientLocation);
patientLocationRouter.get('/', patientLocationController.getPatientLocations);
patientLocationRouter.patch('/:id', patientLocationController.updatePatientLocation);
patientLocationRouter.delete('/:id', patientLocationController.deletePatientLocation);
