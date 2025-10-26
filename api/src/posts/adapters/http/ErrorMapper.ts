// src/posts/adapters/http/ErrorMapper.ts

/**
 * Maps posts domain error codes to HTTP status codes.
 * This is the only place in the posts module that knows about
 * the relationship between domain errors and HTTP status codes.
 */
export const errorCodeToStatus: Record<string, number> = {
  POST_NOT_FOUND: 404,
  POST_VALIDATION_ERROR: 400,
};

