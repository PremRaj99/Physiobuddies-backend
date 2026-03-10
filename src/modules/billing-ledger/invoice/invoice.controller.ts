import { OkResponse } from "@/core/response/ApiResponse";
import { asyncHandler } from "@/core/response/responseHandler";
import { Request, Response, NextFunction } from 'express';
import invoiceService from "./invoice.service";

class InvoiceController {
    getInvoiceById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const invoiceId = req.params.id;
        // Logic to get invoice details by ID
        const invoiceDetails = await invoiceService.getInvoiceById(invoiceId);
        res.json(new OkResponse(invoiceDetails));
    });
}

export default new InvoiceController();