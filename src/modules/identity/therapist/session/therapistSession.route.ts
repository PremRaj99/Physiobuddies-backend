import { Router } from "express";
import therapistSessionController from "./therapistSession.controller";

export const therapistSessionRouter = Router();

therapistSessionRouter.get("/today", therapistSessionController.getTodaySessions);
therapistSessionRouter.get("/upcoming", therapistSessionController.getUpcomingSessions);