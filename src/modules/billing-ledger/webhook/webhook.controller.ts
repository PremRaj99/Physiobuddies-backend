import { AcceptedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { Request, Response, NextFunction } from 'express';

class WebhookController {
  handlePaymentWebhook = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Implementation for handling payment webhook
    res.status(202).json(new AcceptedResponse('Webhook received and processed successfully'));
  });
}

export const webhookController = new WebhookController();
