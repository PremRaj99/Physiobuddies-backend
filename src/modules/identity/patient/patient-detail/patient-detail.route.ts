import { Router } from 'express';
import { patientDetailController } from './patient-detail.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { PatientOnly } from '@/core/middlewares/verifyPatient';

export const patientDetailsRouter = Router();

patientDetailsRouter.use(verifyJWT);
patientDetailsRouter.use(PatientOnly);

patientDetailsRouter.post('/', patientDetailController.createPatientDetail);
patientDetailsRouter.get('/', patientDetailController.getPatientDetails);
patientDetailsRouter.patch('/:id', patientDetailController.updatePatientDetail);
patientDetailsRouter.delete('/:id', patientDetailController.deletePatientDetail);
