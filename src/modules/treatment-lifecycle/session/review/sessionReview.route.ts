import { Router } from "express";
import sessionReviewController from "./sessionReview.controller";

export const sessionReviewRouter = Router();

sessionReviewRouter.post("/:id/review", sessionReviewController.submitReview);
sessionReviewRouter.get("/:id/reviews", sessionReviewController.getReviews);
