import { Router } from "express";
import sessionAssessmentController from "./sessionAssessment.controller";
export const sessionAssessmentRouter = Router();

sessionAssessmentRouter.get("/:id/assessment", sessionAssessmentController.getAssessment);
sessionAssessmentRouter.post("/:id/assessment", sessionAssessmentController.createOrUpdateAssessment);