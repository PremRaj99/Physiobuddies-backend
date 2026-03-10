import { Response, Request, NextFunction } from "express";
import { asyncHandler } from "@/core/response/responseHandler";
import sessionReviewService from "./sessionReview.service";
import { OkResponse, AcceptedResponse } from "@/core/response/ApiResponse";

class SessionReviewController {
    submitReview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const sessionId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.user.id; // Assuming user ID is available in the request object
        await sessionReviewService.submitReview(sessionId, { userId, rating, comment });
        res.status(202).json(new AcceptedResponse("Review submitted successfully"));
    });

    getReviews = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const sessionId = req.params.id;
        const reviews = await sessionReviewService.getReviews(sessionId);
        res.json(new OkResponse(reviews));
    });
}

export default new SessionReviewController();
