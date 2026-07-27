import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import webhookService from './webhook.service';

class WebhookController {
  handlePaymentWebhook = asyncHandler(async (req, res, _next) => {
    const payload = req.body || {};
    const result = await webhookService.handlePaymentWebhook(payload);
    return new OkResponse(result).send(res);
  });
}

export const webhookController = new WebhookController();
