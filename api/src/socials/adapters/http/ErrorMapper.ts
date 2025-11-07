// src/socials/adapters/http/ErrorMapper.ts

/**
 * Maps socials domain error codes to HTTP status codes.
 * This is the only place in the socials module that knows about
 * the relationship between domain errors and HTTP status codes.
 */
export const errorCodeToStatus: Record<string, number> = {
  SOCIALS_INVALID_FOLLOW_ACTIVITY: 400,
  SOCIALS_USER_NOT_FOUND: 404,
  SOCIALS_INTERNAL_SERVER_ERROR: 500,
};

