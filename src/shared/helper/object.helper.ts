/**
 * Filters out properties with value `undefined` from an object.
 * Useful for constructing clean Prisma update payload objects.
 */
export const removeUndefinedProps = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;
};
