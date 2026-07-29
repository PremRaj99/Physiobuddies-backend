import { RazorpayWebhookPayload } from './webhook.service';

/**
 * Extracts payment ID, order ID, and session ID from webhook payload data.
 */
export const extractWebhookPaymentInfo = (body: RazorpayWebhookPayload) => {
  const entity = body?.payload?.payment?.entity;
  const gatewayPaymentId = body?.gatewayPaymentId || body?.paymentId || entity?.id;
  const gatewayOrderId = body?.gatewayOrderId || entity?.order_id;
  const sessionId = body?.sessionId || entity?.notes?.sessionId;

  return {
    gatewayPaymentId,
    gatewayOrderId,
    sessionId,
  };
};
