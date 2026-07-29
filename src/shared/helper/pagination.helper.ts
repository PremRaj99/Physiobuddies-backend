/**
 * Helper to compute database pagination skip and take values.
 */
export const getPaginationParams = (
  page?: number,
  limit?: number,
  defaultLimit = 10,
): { skip: number; take: number; page: number; limit: number } => {
  const p = Math.max(page ?? 1, 1);
  const l = Math.max(limit ?? defaultLimit, 1);
  const skip = (p - 1) * l;
  return { skip, take: l, page: p, limit: l };
};
