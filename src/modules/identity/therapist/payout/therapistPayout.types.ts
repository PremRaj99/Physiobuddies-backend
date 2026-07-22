import { z } from 'zod';

export const RequestPayoutSchema = z.object({
  amount: z.number('amount is required').gt(0, 'Amount must be greater than 0'),
});
