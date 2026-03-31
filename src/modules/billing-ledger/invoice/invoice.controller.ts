import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import invoiceService from './invoice.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class InvoiceController {
  getInvoiceById = asyncHandler(async (req, res, _next) => {
    const invoiceId = validateSchema(ObjectIdSchema, req.params.id);
    const invoiceDetails = await invoiceService.getInvoiceById(invoiceId);
    return new OkResponse(invoiceDetails).send(res);
  });
}

export default new InvoiceController();
