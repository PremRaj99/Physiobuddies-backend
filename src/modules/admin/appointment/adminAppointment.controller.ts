import { OkResponse } from "@/core/response/ApiResponse";
import { asyncHandler } from "@/core/response/responseHandler";
import { NextFunction, Request, Response } from "express";

class AdminAppointmentController {
    getAllAppointments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Logic to get all appointments
        res.json(new OkResponse([]));
    });

    getAppointmentById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const appointmentId = req.params.id;
        // Logic to get appointment by ID
        res.json(new OkResponse({}));

    });
}

export default new AdminAppointmentController();