import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import reservationService from './reservation.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class ReservationController {
  // Implement reservation-related request handling here
  holdReservation = asyncHandler(async (req, res, _next) => {
    // Logic to hold a reservation
    const reservationData = req.body;
    await reservationService.holdReservation(reservationData);
    return new AcceptedResponse('Reservation held successfully').send(res);
  });
  getReservationById = asyncHandler(async (req, res, _next) => {
    const reservationId = validateSchema(ObjectIdSchema, req.params.id);
    // Logic to get reservation details by ID
    const reservationDetails = await reservationService.getReservationById(reservationId);
    return new OkResponse(reservationDetails).send(res);
  });
  cancelReservation = asyncHandler(async (req, res, _next) => {
    const reservationId = validateSchema(ObjectIdSchema, req.params.id);
    // Logic to cancel a reservation
    await reservationService.cancelReservation(reservationId);
    return new AcceptedResponse('Reservation canceled successfully').send(res);
  });
}

export default new ReservationController();
