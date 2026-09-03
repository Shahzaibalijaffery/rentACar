/**
 * Prisma MongoDB does not match omitted optional DateTime fields with `{ field: null }`.
 * Use this for unused/revoked timestamps that are unset until first write.
 */
export const MONGO_DATE_UNSET = { isSet: false } as const;
