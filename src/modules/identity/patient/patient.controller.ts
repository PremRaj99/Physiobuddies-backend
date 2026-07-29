import { isAuth } from '@/core/middlewares/isAuth';
import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { patientService } from './patient.service';

class PatientController {
  patientInfo = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const patientInfo = await patientService.patientInfo(req.user.id);
    return new OkResponse(patientInfo).send(res);
  });

  getMyBookings = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookings = await patientService.getMyBookings(req.user.id);
    return new OkResponse(bookings).send(res);
  });
}

export const patientController = new PatientController();
