// src/admin/adapters/http/ErrorMapper.ts

/**
 * Maps admin domain error codes to HTTP status codes.
 * This is the only place in the admin module that knows about
 * the relationship between domain errors and HTTP status codes.
 */
export const errorCodeToStatus: Record<string, number> = {
  ADMIN_NOT_FOUND: 404,
  ADMIN_VALIDATION_ERROR: 400,
  ADMIN_BUSINESS_RULE_ERROR: 422,
  ADMIN_INTERNAL_SERVER_ERROR: 500,
};

