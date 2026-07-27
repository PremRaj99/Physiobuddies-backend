import { asyncHandler } from '@/core/response/responseHandler';
import sessionService from './treatmentSession.service';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { isAuth } from '@/core/middlewares/isAuth';
import {
  RescheduleSlotSchema,
  CancelSessionSchema,
  AddDocsSchema,
  ImprovementRecordSchema,
  VerifyOtpSchema,
  BookMoreSessionSchema,
} from './treatmentSession.type';

class TreatmentSessionController {
  // GET /:id
  getSession = asyncHandler(async (req, res, _next) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await sessionService.getSession(sessionId);
    return new OkResponse(result).send(res);
  });

  // POST /confirm
  confirmBookingSession = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.body.sessionId);
    await sessionService.confirmBookingSession(sessionId, req.user.id);
    return new AcceptedResponse('Session confirmed successfully').send(res);
  });

  // POST /:id/notification
  sendNotification = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const notificationIds = await sessionService.sendNotification(sessionId);
    return new OkResponse({ notificationIds }).send(res);
  });

  // POST /:id/send-otp
  sendOtp = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await sessionService.sendOtp(sessionId, req.user.id);
    return new OkResponse(result).send(res);
  });

  // POST /:id/verify-otp
  verifyOtp = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const body = validateSchema(VerifyOtpSchema, req.body);
    await sessionService.verifyOtp(sessionId, body.otp);
    return new AcceptedResponse('OTP verified — session started').send(res);
  });

  // POST /:id/reschedule-slot
  rescheduleSlot = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const body = validateSchema(RescheduleSlotSchema, req.body);
    const result = await sessionService.rescheduleSlot(sessionId, req.user.id, body);
    return new AcceptedResponse(result.message).send(res);
  });

  // POST /:id/cancel
  cancelSession = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const body = validateSchema(CancelSessionSchema, req.body);
    await sessionService.cancelSession(sessionId, req.user.id, req.user.role, body.reason);
    return new AcceptedResponse('Session cancelled successfully').send(res);
  });

  // POST /:id/no-show
  markNoShow = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.markNoShow(sessionId, req.user.id);
    return new AcceptedResponse('Session marked as no-show successfully').send(res);
  });

  // POST /:id/add-docs
  addDocs = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const body = validateSchema(AddDocsSchema, req.body);
    const result = await sessionService.addDocs(sessionId, req.user.id, body);
    return new OkResponse(result).send(res);
  });

  // POST /:id/improvement-record
  improvementRecord = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const body = validateSchema(ImprovementRecordSchema, req.body);
    await sessionService.improvementRecord(sessionId, req.user.id, body);
    return new AcceptedResponse('Improvement record saved — session completed').send(res);
  });

  // POST /:id/start (legacy)
  startSession = asyncHandler(async (req, res, _next) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.startSession(sessionId);
    return new AcceptedResponse('Session started successfully').send(res);
  });

  // POST /:id/complete (legacy)
  completeSession = asyncHandler(async (req, res, _next) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await sessionService.completeSession(sessionId);
    return new AcceptedResponse('Session completed successfully').send(res);
  });

  // GET /:id/see-more-slots
  seeMoreSlots = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const treatmentPlanId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await sessionService.seeMoreSlots(treatmentPlanId);
    return new OkResponse(result).send(res);
  });

  // POST /book-more-session
  bookMoreSession = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const body = validateSchema(BookMoreSessionSchema, req.body);
    const result = await sessionService.bookMoreSession(req.user.id, body);
    return new OkResponse(result).send(res);
  });
}

export default new TreatmentSessionController();
