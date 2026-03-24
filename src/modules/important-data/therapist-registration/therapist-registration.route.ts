import { Router } from 'express';
import { therapistRegistrationController } from './therapist-registration.controller';
import { AdminOnly } from '@/core/middlewares/verifyAdmin';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const therapistRegistrationRouter = Router();

therapistRegistrationRouter.use(verifyJWT);

therapistRegistrationRouter.post('/', therapistRegistrationController.submitRegistration);

therapistRegistrationRouter.use(AdminOnly);

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
