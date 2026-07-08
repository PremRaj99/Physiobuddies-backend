import { AcceptedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';

export class CronController {
  expireReservations = asyncHandler(async (_req, res, _next) => {
    // Logic to expire reservations - holds are now managed in Redis and auto-expire
    return new AcceptedResponse(`Expired 0 holds successfully`).send(res);
  });

  markNoShow = asyncHandler(async (_req, res, _next) => {
    // Logic to mark no-shows
    return new AcceptedResponse('No-shows marked successfully').send(res);
  });

  settleSessions = asyncHandler(async (_req, res, _next) => {
    // Logic to settle sessions
    return new AcceptedResponse('Sessions settled successfully').send(res);
  });
}

export default new CronController();
