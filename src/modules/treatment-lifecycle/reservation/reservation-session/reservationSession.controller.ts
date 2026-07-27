import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { patientService } from '@/modules/identity/patient/patient.service';
import { bookingSessionService } from './reservationSession.service';
import {
  ApplyCouponSchema,
  CreateBookingSessionSchema,
  UpdateBookingFormSchema,
} from './reservationSession.type';

class ReservationSessionController {
  createBookingSession = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const body = validateSchema(CreateBookingSessionSchema, req.body);

    const result = await bookingSessionService.createBookingSession({
      patientId: patient.id,
      therapistId: body.therapistId,
      date: new Date(body.date),
      startHour: body.startHour,
    });
    return new OkResponse(result).send(res);
  });

  getBookingSession = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const sessionId = req.params.id as string;

    const result = await bookingSessionService.getBookingSession(sessionId, patient.id);
    return new OkResponse(result).send(res);
  });

  updateBookingForm = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const sessionId = req.params.id as string;
    const body = validateSchema(UpdateBookingFormSchema, req.body);

    const result = await bookingSessionService.updateBookingSessionForm(
      sessionId,
      patient.id,
      body,
    );
    return new OkResponse(result).send(res);
  });

  applyCoupon = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const sessionId = req.params.id as string;
    const body = validateSchema(ApplyCouponSchema, req.body);

    const result = await bookingSessionService.applyCoupon(sessionId, patient.id, body.couponCode);
    return new OkResponse(result).send(res);
  });

  removeCoupon = asyncHandler(async (req, res, _next) => {
    const patient = await patientService.getPatientByUserId(req.user!.id);
    const sessionId = req.params.id as string;

    const result = await bookingSessionService.removeCoupon(sessionId, patient.id);
    return new OkResponse(result).send(res);
  });

  initiatePayment = asyncHandler(async (req, res, _next) => {
    const sessionId = req.params.id as string;

    const result = await bookingSessionService.initiatePayment(sessionId, req.user!.id);
    return new OkResponse(result).send(res);
  });

  getBookingStatus = asyncHandler(async (req, res, _next) => {
    const sessionId = req.params.id as string;

    const result = await bookingSessionService.getBookingStatus(sessionId);
    return new OkResponse(result).send(res);
  });

  finalizeBooking = asyncHandler(async (req, res, _next) => {
    const sessionId = req.params.id as string;
    const gatewayPaymentId = req.body?.gatewayPaymentId as string | undefined;

    const result = await bookingSessionService.finalizeBooking(sessionId, gatewayPaymentId);
    return new OkResponse(result).send(res);
  });
}

export const reservationSessionController = new ReservationSessionController();
