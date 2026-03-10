import { Router } from "express";
import { webhookController } from "./webhook.controller";

export const webhookRouter = Router();

// Define webhook-related routes here
webhookRouter.post('/payments', webhookController.handlePaymentWebhook);