import { CreatePaymentOrderDTO } from './payment.type';

/**
 * Builds Razorpay order creation options object.
 */
export const buildRazorpayOrderOptions = (dto: CreatePaymentOrderDTO, defaultReceipt: string) => {
  const { amount, currency = 'INR', userId, purpose = 'therapy_session', receipt, notes } = dto;
  return {
    amount,
    currency,
    receipt: receipt || defaultReceipt,
    notes: {
      userId,
      purpose,
      ...notes,
    },
  };
};

/**
 * Formats verification result payload.
 */
export const formatPaymentVerificationResponse = (
  paymentId: string,
  orderId: string,
  reservationResult: unknown,
) => {
  return {
    verified: true,
    paymentId,
    orderId,
    reservation: reservationResult,
  };
};
