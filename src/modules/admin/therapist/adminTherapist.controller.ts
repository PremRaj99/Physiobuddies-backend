import { Response, Request, NextFunction } from "express";
import adminTherapistService from "./adminTherapist.service";
import { asyncHandler } from "@/core/response/responseHandler";
import { AcceptedResponse, OkResponse } from "@/core/response/ApiResponse";

class AdminTherapistController {
    getAllTherapists = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const therapists = await adminTherapistService.getAllTherapists();
        res.json(new OkResponse(therapists));
    });

    verifyTherapist = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const therapistId = req.params.id;
        await adminTherapistService.verifyTherapist(therapistId);
        res.status(202).json(new AcceptedResponse("Therapist verified successfully"));
    });

    updateCommissionRate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const therapistId = req.params.id;
        const { commissionRate } = req.body;
        await adminTherapistService.updateCommissionRate(therapistId, commissionRate);
        res.status(202).json(new AcceptedResponse("Commission rate updated successfully"));
    });
}

export default new AdminTherapistController();