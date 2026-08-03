export const softDeleteWhereClause = <T extends Record<string, unknown>>(where?: T) => {
  return {
    ...where,
    OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
  };
};
