import { Router } from "express";
import adminAppointmentController from "./adminAppointment.controller";

export const adminAppointmentRouter = Router();

adminAppointmentRouter.get("/", adminAppointmentController.getAllAppointments);
adminAppointmentRouter.get("/:id", adminAppointmentController.getAppointmentById);