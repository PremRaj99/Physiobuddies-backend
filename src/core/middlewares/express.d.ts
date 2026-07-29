import { Logger } from 'winston';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
      requestId?: string;
      logger: Logger;
      razorpayVerified?: {
        orderId: string;
        paymentId: string;
      };
      rawBody?: Buffer;
    }
  }
}

export {};
