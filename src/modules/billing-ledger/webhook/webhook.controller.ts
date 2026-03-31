import { AcceptedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';

class WebhookController {
  handlePaymentWebhook = asyncHandler(async (_req, res, _next) => {
    // Implementation for handling payment webhook
    return new AcceptedResponse('Webhook received and processed successfully').send(res);
  });
}

export const webhookController = new WebhookController();
