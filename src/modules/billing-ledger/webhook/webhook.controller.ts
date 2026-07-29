import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import webhookService from './webhook.service';

class WebhookController {
  handlePaymentWebhook = asyncHandler(async (req, res, _next) => {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = req.rawBody;
    const payload = req.body || {};

    const result = await webhookService.handlePaymentWebhook(payload, rawBody, signature);
    return new OkResponse(result).send(res);
  });
}

export const webhookController = new WebhookController();
