import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { therapistRegistrationService } from './therapist-registration.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class TherapistRegistrationController {
  submitRegistration = asyncHandler(async (_req, res, _next) => {
    return new AcceptedResponse('Therapist registration submitted successfully').send(res);
  });

  getAllRegistrations = asyncHandler(async (_req, res, _next) => {
    const registrations = await therapistRegistrationService.getAllRegistrations();
    return new OkResponse(registrations).send(res);
  });

  getRegistrationById = asyncHandler(async (req, res, _next) => {
    const id = validateSchema(ObjectIdSchema, req.params.id);
    const registration = await therapistRegistrationService.getRegistrationById(id);
    return new OkResponse(registration).send(res);
  });

  updateRegistrationStatus = asyncHandler(async (_req, res, _next) => {
    return new AcceptedResponse('Registration status updated').send(res);
  });

  approveRegistration = asyncHandler(async (req, res, _next) => {
    const id = validateSchema(ObjectIdSchema, req.params.id);
    const message = await therapistRegistrationService.approveRegistration(id);
    return new AcceptedResponse(message).send(res);
  });

  rejectRegistration = asyncHandler(async (req, res, _next) => {
    const id = validateSchema(ObjectIdSchema, req.params.id);
    const reason = req.body?.reason;
    const message = await therapistRegistrationService.rejectRegistration(id, reason);
    return new AcceptedResponse(message).send(res);
  });
}

export const therapistRegistrationController = new TherapistRegistrationController();
