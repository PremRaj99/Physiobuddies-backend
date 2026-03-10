import { AcceptedResponse } from "@/core/response/ApiResponse";
import { asyncHandler } from "@/core/response/responseHandler";
import { Request, Response, NextFunction } from 'express';
import reservationService from "./reservation.service";


class ReservationController {
    // Implement reservation-related request handling here
    holdReservation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Logic to hold a reservation
        const reservationData = req.body;
        await reservationService.holdReservation(reservationData);
        res.status(202).json(new AcceptedResponse("Reservation held successfully"));
    });
    getReservationById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const reservationId = req.params.id;
        // Logic to get reservation details by ID
        const reservationDetails = await reservationService.getReservationById(reservationId);
        res.status(200).json(reservationDetails);
    });
    cancelReservation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const reservationId = req.params.id;
        // Logic to cancel a reservation
        const cancellationResult = await reservationService.cancelReservation(reservationId);
        res.status(200).json(cancellationResult);
    });
}

export default new ReservationController();