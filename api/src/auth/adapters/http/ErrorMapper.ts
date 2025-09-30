// src/auth/adapters/http/ErrorMapper.ts

export const errorCodeToStatus: Record<string, number> = {
  AUTHENTICATION_ERROR: 401,
  CREDENTIALS_NOT_FOUND: 404,
  AUTH_VALIDATION_ERROR: 400,
  AUTH_CONFLICT_ERROR: 409,
  AUTH_BUSINESS_RULE_ERROR: 422,
  AUTH_INTERNAL_SERVER_ERROR: 500,
};

