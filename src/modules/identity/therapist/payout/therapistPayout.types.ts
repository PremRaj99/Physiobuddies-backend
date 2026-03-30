import { z } from 'zod';

export const RequestPayoutSchema = z.object({
  amount: z.number('amount is required').gte(0, 'Amount should be greater then 0'),
});
