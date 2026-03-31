import { isAuth } from '@/core/middlewares/isAuth';
import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '../../auth/auth.type';
import { PatientLocationSchema, UpdatePatientLocationSchema } from '../patient.type';
import { patientLocationService } from './patient-location.service';

class PatientLocationController {
  // Implement patient location-specific endpoints here
  createPatientLocation = asyncHandler(async (req, res, _next) => {
    // Placeholder for create patient location endpoint logic
    isAuth(req);
    const parseData = validateSchema(PatientLocationSchema, req.body);

    await patientLocationService.createPatientLocation(req.user.id, parseData);

    return new CreatedResponse('Patient location created successfully').send(res);
  });

  getPatientLocations = asyncHandler(async (req, res, _next) => {
    // Placeholder for get patient location endpoint logic
    isAuth(req);
    const patientLocations = await patientLocationService.getPatientLocations(req.user.id);
    return new OkResponse(patientLocations).send(res);
  });

  updatePatientLocation = asyncHandler(async (req, res, _next) => {
    // Placeholder for update patient location endpoint logic
    isAuth(req);
    const parseData = validateSchema(UpdatePatientLocationSchema, req.body);
    const locationId = validateSchema(ObjectIdSchema, req.params.id);

    await patientLocationService.updatePatientLocation(locationId, req.user.id, parseData);
    return new AcceptedResponse('Patient location updated successfully').send(res);
  });

  deletePatientLocation = asyncHandler(async (req, res, _next) => {
    // Placeholder for delete patient location endpoint logic
    isAuth(req);
    const locationId = validateSchema(ObjectIdSchema, req.params.id);
    await patientLocationService.deletePatientLocation(locationId, req.user.id);
    return new AcceptedResponse('Patient location deleted successfully').send(res);
  });
}

export const patientLocationController = new PatientLocationController();
