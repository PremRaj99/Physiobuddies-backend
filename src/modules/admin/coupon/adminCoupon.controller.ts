import { Response, Request, NextFunction } from "express";
import adminCouponService from "./adminCoupon.service";
import { asyncHandler } from "@/core/response/responseHandler";
import { OkResponse, AcceptedResponse } from "@/core/response/ApiResponse";

class AdminCouponController {
    createCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const couponData = req.body;
        const newCoupon = await adminCouponService.createCoupon(couponData);
        res.json(new OkResponse("Coupon created successfully", newCoupon));
    })

    updateCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const couponId = req.params.id;
        const updateData = req.body;
        const updatedCoupon = await adminCouponService.updateCoupon(couponId, updateData);
        res.json(new OkResponse("Coupon updated successfully", updatedCoupon));
    }
    )

    deleteCoupon = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const couponId = req.params.id;
        await adminCouponService.deleteCoupon(couponId);
        res.status(202).json(new AcceptedResponse("Coupon deleted successfully"));
    }
    )
}

export default new AdminCouponController();
