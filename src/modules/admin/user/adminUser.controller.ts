import { AcceptedResponse, OkResponse } from "@/core/response/ApiResponse";
import { asyncHandler } from "@/core/response/responseHandler";
import { NextFunction, Request, Response } from "express";

class AdminUserController {
    getAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Logic to get all users
        res.json(new OkResponse([]));
    });

    blockUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.params.id;
        // Logic to block the user with userId
        res.json(new AcceptedResponse(`User with ID ${userId} has been blocked`));
    });
}

export default new AdminUserController();
