import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { reservationService } from './reservation.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { HoldReservationSchema } from './reservation.type';
import { patientService } from '@/modules/identity/patient/patient.service';

class ReservationController {
  holdReservation = asyncHandler(async (req, res, _next) => {
    // We assume the logged-in user is a patient. We get their patient profile ID.
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const body = validateSchema(HoldReservationSchema, req.body);

    const result = await reservationService.holdReservation({
      patientId: patient.id,
      therapistId: body.therapistId,
      date: new Date(body.date),
      startHour: body.startHour,
    });
    return new AcceptedResponse(result.message).send(res);
  });

  confirmReservation = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const reservationId = validateSchema(ObjectIdSchema, req.params.id);

    const result = await reservationService.confirmReservation(reservationId, patient.id);
    return new OkResponse(result).send(res);
  });

  cancelReservation = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const reservationId = validateSchema(ObjectIdSchema, req.params.id);

    const result = await reservationService.cancelReservation(reservationId, patient.id);
    return new AcceptedResponse(result.message).send(res);
  });
}

export const reservationController = new ReservationController();
