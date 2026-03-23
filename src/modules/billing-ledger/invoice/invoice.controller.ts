import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { Request, Response, NextFunction } from 'express';
import invoiceService from './invoice.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class InvoiceController {
  getInvoiceById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const invoiceId = validateSchema(ObjectIdSchema, req.params.id);
    const invoiceDetails = await invoiceService.getInvoiceById(invoiceId);
    return new OkResponse(invoiceDetails).send(res);
  });
}

export default new InvoiceController();
