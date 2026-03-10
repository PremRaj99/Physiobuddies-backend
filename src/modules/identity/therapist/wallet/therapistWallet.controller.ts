import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@/core/response/responseHandler";
import therapistWalletService from "./therapistWallet.service";
import { OkResponse } from "@/core/response/ApiResponse";

class TherapistWalletController {
    getWalletInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const therapistId = req.user.id; // Assuming therapist ID is available in the authenticated user object
        const walletInfo = await therapistWalletService.getWalletInfo(therapistId);
        res.json(new OkResponse(walletInfo));
    });

}

export default new TherapistWalletController();
