// src/socials/adapters/http/ErrorMapper.ts

export const errorCodeToStatus: Record<string, number> = {
  SOCIALS_INVALID_FOLLOW_ACTIVITY: 400,
  SOCIALS_USER_NOT_FOUND: 404,
  SOCIALS_INTERNAL_SERVER_ERROR: 500,
};
