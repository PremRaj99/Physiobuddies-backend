import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { PatientDetailsSchema, UpdatePatientDetailsSchema } from '../patient.type';
import { patientDetailService } from './patient-detail.service';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '../../auth/auth.type';
import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';

class PatientDetailController {
  // Implement patient detail-specific endpoints here
  createPatientDetail = asyncHandler(async (req, res, _next) => {
    // Placeholder for create patient detail endpoint logic
    isAuth(req);
    const parseData = validateSchema(PatientDetailsSchema, req.body);

    await patientDetailService.createPatientDetail(req.user.id, parseData);
    return new CreatedResponse('Patient detail created successfully').send(res);
  });

  getPatientDetails = asyncHandler(async (req, res, _next) => {
    // Placeholder for get patient details endpoint logic
    isAuth(req);
    const patientDetails = await patientDetailService.getPatientDetails(req.user.id);
    return new OkResponse(patientDetails).send(res);
  });

  updatePatientDetail = asyncHandler(async (req, res, _next) => {
    // Placeholder for update patient detail endpoint logic
    const patientDetailId = validateSchema(ObjectIdSchema, req.params.id);
    isAuth(req);
    const parseData = validateSchema(UpdatePatientDetailsSchema, req.body);
    await patientDetailService.updatePatientDetail(patientDetailId, req.user.id, parseData);
    return new AcceptedResponse('Patient detail updated successfully').send(res);
  });

  deletePatientDetail = asyncHandler(async (req, res, _next) => {
    // Placeholder for delete patient detail endpoint logic
    const patientDetailId = validateSchema(ObjectIdSchema, req.params.id);
    isAuth(req);
    await patientDetailService.deletePatientDetail(patientDetailId, req.user.id);
    return new AcceptedResponse('Patient detail deleted successfully').send(res);
  });
}

export const patientDetailController = new PatientDetailController();
