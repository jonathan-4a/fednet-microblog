// src/users/adapters/http/ErrorMapper.ts

/**
 * Maps user domain error codes to HTTP status codes.
 * This is the only place in the users module that knows about
 * the relationship between domain errors and HTTP status codes.
 */
export const errorCodeToStatus: Record<string, number> = {
  USER_NOT_FOUND: 404,
  USER_ALREADY_EXISTS: 409,
  USER_VALIDATION_ERROR: 400,
};


