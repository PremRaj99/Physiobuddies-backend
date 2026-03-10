import type { z, ZodTypeAny } from 'zod';
import { ValidationError } from '../errors/ApiError';

export const validateSchema = <T extends ZodTypeAny>(Schema: T, data: unknown): z.infer<T> => {
  const parseResult = Schema.safeParse(data);

  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    throw new ValidationError(firstIssue ? firstIssue.message : 'Validation error');
  }
  return parseResult.data;
};
