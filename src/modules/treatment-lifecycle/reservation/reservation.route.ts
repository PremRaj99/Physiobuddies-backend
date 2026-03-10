import { Router } from "express";
import reservationController from "./reservation.controller";

export const reservationRouter = Router();

// Define reservation-related routes here
reservationRouter.post("/hold", reservationController.holdReservation);
reservationRouter.get("/:id", reservationController.getReservationById);
reservationRouter.delete("/:id", reservationController.cancelReservation);