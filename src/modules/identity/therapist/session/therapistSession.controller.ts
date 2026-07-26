import { asyncHandler } from '@/core/response/responseHandler';
import { therapistSessionService } from './therapistSession.service';
import { OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '../../auth/auth.type';

import { isAuth } from '@/core/middlewares/isAuth';

class TherapistSessionController {
  getMyBookings = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookings = await therapistSessionService.getMyBookings(req.user.id);
    return new OkResponse(bookings).send(res);
  });

  getTodaySessions = asyncHandler(async (req, res, _next) => {
    const therapistId = validateSchema(ObjectIdSchema, req.params.therapistId);
    const todaySessions = await therapistSessionService.getTodaySessions(therapistId);
    return new OkResponse(todaySessions).send(res);
  });

  getUpcomingSessions = asyncHandler(async (req, res, _next) => {
    const therapistId = validateSchema(ObjectIdSchema, req.params.therapistId);
    const upcomingSessions = await therapistSessionService.getUpcomingSessions(therapistId);
    return new OkResponse(upcomingSessions).send(res);
  });

  getBookingById = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookingId = validateSchema(ObjectIdSchema, req.params.id);
    const booking = await therapistSessionService.getBookingById(req.user.id, bookingId);
    return new OkResponse(booking).send(res);
  });

  acceptBooking = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookingId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await therapistSessionService.acceptBooking(req.user.id, bookingId);
    return new OkResponse(result).send(res);
  });

  generateOtp = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookingId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await therapistSessionService.generateSessionOtp(req.user.id, bookingId);
    return new OkResponse(result).send(res);
  });

  verifyOtp = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookingId = validateSchema(ObjectIdSchema, req.params.id);
    const { otp } = req.body;
    const result = await therapistSessionService.verifySessionOtp(req.user.id, bookingId, otp);
    return new OkResponse(result).send(res);
  });

  endSession = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const bookingId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await therapistSessionService.endSession(req.user.id, bookingId);
    return new OkResponse(result).send(res);
  });

  completePlan = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const planId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await therapistSessionService.completeTreatmentPlan(
      req.user.id,
      planId,
      req.body,
    );
    return new OkResponse(result).send(res);
  });
}

export default new TherapistSessionController();
