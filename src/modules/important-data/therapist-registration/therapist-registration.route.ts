import { Router } from 'express';
import { therapistRegistrationController } from './therapist-registration.controller';

export const therapistRegistrationRouter = Router();

therapistRegistrationRouter.post('/', therapistRegistrationController.submitRegistration);
therapistRegistrationRouter.get('/', therapistRegistrationController.getAllRegistrations);
therapistRegistrationRouter.get('/:id', therapistRegistrationController.getRegistrationById);
therapistRegistrationRouter.patch(
  '/:id/status',
  therapistRegistrationController.updateRegistrationStatus,
);
therapistRegistrationRouter.post(
  '/:id/approve',
  therapistRegistrationController.approveRegistration,
);
therapistRegistrationRouter.post('/:id/reject', therapistRegistrationController.rejectRegistration);
