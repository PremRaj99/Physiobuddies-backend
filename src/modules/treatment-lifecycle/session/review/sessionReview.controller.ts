import { Response, Request, NextFunction } from 'express';
import { asyncHandler } from '@/core/response/responseHandler';
import sessionReviewService from './sessionReview.service';
import { OkResponse, AcceptedResponse } from '@/core/response/ApiResponse';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { validateSchema } from '@/core/utils/validateSchema';

class SessionReviewController {
  submitReview = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const { rating, comment } = req.body;
    const userId = req.user.id; // Assuming user ID is available in the request object
    await sessionReviewService.submitReview(sessionId, { userId, rating, comment });
    return new AcceptedResponse('Review submitted successfully').send(res);
  });

  getReviews = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    const reviews = await sessionReviewService.getReviews(sessionId);
    return new OkResponse(reviews).send(res);
  });
}

export default new SessionReviewController();
