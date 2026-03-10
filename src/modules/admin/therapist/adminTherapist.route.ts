import { Router } from "express";
import adminTherapistController from "./adminTherapist.controller";

export const adminTherapistRouter = Router();

adminTherapistRouter.get("/", adminTherapistController.getAllTherapists);
adminTherapistRouter.patch("/:id/verify", adminTherapistController.verifyTherapist);
adminTherapistRouter.patch("/:id/commission-rate", adminTherapistController.updateCommissionRate);