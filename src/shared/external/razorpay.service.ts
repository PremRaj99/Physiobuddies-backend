import { RAZORPAY_API_KEY, RAZORPAY_API_SECRET, RAZORPAY_WEBHOOK_SECRET } from '@/core/constants';
import { DatabaseError, ValidationError } from '@/core/errors/ApiError';
import { logger } from '@/core/logger/logger';
import crypto from 'crypto';
import Razorpay from 'razorpay';

class RazorPayService {
  private razorpay: Razorpay | null = null;

  constructor() {
    if (RAZORPAY_API_KEY && RAZORPAY_API_SECRET) {
      this.razorpay = new Razorpay({
        key_id: RAZORPAY_API_KEY,
        key_secret: RAZORPAY_API_SECRET,
      });
    } else {
      logger.warn('Razorpay API keys not configured in environment variables.');
    }
  }

  private getClient(): Razorpay {
    if (!this.razorpay) {
      if (RAZORPAY_API_KEY && RAZORPAY_API_SECRET) {
        this.razorpay = new Razorpay({
          key_id: RAZORPAY_API_KEY,
          key_secret: RAZORPAY_API_SECRET,
        });
      } else {
        throw new DatabaseError('Razorpay configuration missing. Key ID or Secret is not set.');
      }
    }
    return this.razorpay;
  }

  /**
   * Create a new Razorpay Order for Checkout
   * @param amount Amount in standard currency unit (e.g. INR in Rupees). Will be converted to paise internally.
   */
  async createOrder({
    amount,
    currency = 'INR',
    receipt,
    notes,
  }: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }) {
    const client = this.getClient();
    // Convert to smallest currency unit (paise for INR)
    const amountInSubunits = Math.round(amount * 100);

    try {
      const order = await client.orders.create({
        amount: amountInSubunits,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      });
      return order;
    } catch (error) {
      logger.error('Failed to create Razorpay Order', { error, amount, currency });
      throw new DatabaseError('Payment gateway error while creating order.');
    }
  }

  /**
   * Verify HMAC-SHA256 signature returned by Razorpay Checkout
   */
  verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  }: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    if (!RAZORPAY_API_SECRET) {
      throw new DatabaseError('Razorpay secret key not configured.');
    }
    try {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_API_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch (error) {
      logger.warn('Razorpay signature verification failed with exception', { error });
      return false;
    }
  }

  /**
   * Verify Razorpay Webhook signature
   */
  verifyWebhookSignature(body: string | Buffer, signature: string, secret?: string): boolean {
    const webhookSecret = secret || RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Razorpay Webhook secret is not configured.');
      return false;
    }
    try {
      return Razorpay.validateWebhookSignature(
        typeof body === 'string' ? body : body.toString('utf8'),
        signature,
        webhookSecret,
      );
    } catch (error) {
      logger.warn('Webhook signature validation failed', { error });
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId: string) {
    const client = this.getClient();
    try {
      return await client.payments.fetch(paymentId);
    } catch (error) {
      logger.error('Error fetching Razorpay payment', { error, paymentId });
      throw new ValidationError('Payment not found on Razorpay.');
    }
  }

  /**
   * Capture an authorized payment (if auto-capture is disabled)
   */
  async capturePayment(paymentId: string, amount: number, currency = 'INR') {
    const client = this.getClient();
    const amountInSubunits = Math.round(amount * 100);
    try {
      return await client.payments.capture(paymentId, amountInSubunits, currency);
    } catch (error) {
      logger.error('Error capturing Razorpay payment', { error, paymentId, amount });
      throw new DatabaseError('Failed to capture payment.');
    }
  }

  /**
   * Initiate a refund for a payment
   * @param amount Optional partial refund amount in Rupees. If omitted, full refund is issued.
   */
  async initiateRefund(
    paymentId: string,
    options?: {
      amount?: number;
      notes?: Record<string, string>;
      receipt?: string;
    },
  ) {
    const client = this.getClient();
    const payload: { amount?: number; notes?: Record<string, string>; receipt?: string } = {};

    if (options?.amount) {
      payload.amount = Math.round(options.amount * 100);
    }
    if (options?.notes) payload.notes = options.notes;
    if (options?.receipt) payload.receipt = options.receipt;

    try {
      const refund = await client.payments.refund(paymentId, payload);
      return refund;
    } catch (error) {
      logger.error('Error initiating refund on Razorpay', { error, paymentId, options });
      throw new DatabaseError('Failed to process refund on payment gateway.');
    }
  }

  /**
   * Fetch refund details
   */
  async fetchRefund(paymentId: string, refundId: string) {
    const client = this.getClient();
    try {
      return await client.payments.fetchRefund(paymentId, refundId);
    } catch (error) {
      logger.error('Error fetching refund', { error, paymentId, refundId });
      throw new ValidationError('Refund record not found.');
    }
  }

  /**
   * Fetch all refunds for a payment
   */
  async fetchAllRefunds(paymentId: string) {
    const client = this.getClient();
    try {
      return await client.payments.fetchMultipleRefund(paymentId, {});
    } catch (error) {
      logger.error('Error fetching multiple refunds', { error, paymentId });
      throw new DatabaseError('Failed to fetch refunds for payment.');
    }
  }
}

export default new RazorPayService();
