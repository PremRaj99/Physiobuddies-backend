import { isAuth } from '@/core/middlewares/isAuth';
import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { patientService } from './patient.service';

class PatientController {
  // Implement patient-specific endpoints here
  patientInfo = asyncHandler(async (req, res, _next) => {
    // Placeholder for patient info endpoint logic
    isAuth(req);
    const patientInfo = await patientService.patientInfo(req.user.id);
    return new OkResponse(patientInfo).send(res);
  });
}

export const patientController = new PatientController();
