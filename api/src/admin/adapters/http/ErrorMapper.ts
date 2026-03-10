// src/admin/adapters/http/ErrorMapper.ts
export const errorCodeToStatus: Record<string, number> = {
  ADMIN_NOT_FOUND: 404,
  ADMIN_VALIDATION_ERROR: 400,
  ADMIN_BUSINESS_RULE_ERROR: 422,
  ADMIN_INTERNAL_SERVER_ERROR: 500,
};
