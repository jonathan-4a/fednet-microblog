// src/posts/adapters/http/ErrorMapper.ts

export const errorCodeToStatus: Record<string, number> = {
  POST_NOT_FOUND: 404,
  POST_VALIDATION_ERROR: 400,
};
