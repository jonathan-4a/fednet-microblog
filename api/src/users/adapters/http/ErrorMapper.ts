// src/users/adapters/http/ErrorMapper.ts

export const errorCodeToStatus: Record<string, number> = {
  USER_NOT_FOUND: 404,
  USER_ALREADY_EXISTS: 409,
  USER_VALIDATION_ERROR: 400,
};
