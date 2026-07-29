export interface CreatePaymentOrderDTO {
  amount: number;
  currency?: string;
  userId: string;
  purpose?: 'therapy_session' | 'subscription';
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentDTO {
  paymentId: string;
  orderId: string;
  signature: string;
  internalPaymentId?: string;
  sessionId?: string;
}

export interface RefundPaymentDTO {
  paymentId: string; // DB payment ID or Razorpay payment ID
  amount?: number; // Partial refund amount in INR
  reason?: string;
}
