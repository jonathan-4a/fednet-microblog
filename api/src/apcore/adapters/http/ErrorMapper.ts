// src/apcore/adapters/http/ErrorMapper.ts

/**
 * Maps ActivityPub domain error codes to HTTP status codes.
 * This is the only place in the apcore module that knows about
 * the relationship between domain errors and HTTP status codes.
 */
export const errorCodeToStatus: Record<string, number> = {
  ACTIVITYPUB_INVALID_RESOURCE: 400,
  ACTIVITYPUB_CONFIGURATION_ERROR: 500,
  ACTIVITYPUB_MISSING_ACTOR: 400,
  ACTIVITYPUB_INBOX_NOT_FOUND: 400,
  ACTIVITYPUB_FETCH_ERROR: 502,
  ACTIVITYPUB_INVALID_ACTOR_URL: 400,
  ACTIVITYPUB_NOT_FOUND: 404,
  ACTIVITYPUB_VALIDATION_ERROR: 400,
  ACTIVITYPUB_INTERNAL_SERVER_ERROR: 500,
  ACTIVITYPUB_AUTHENTICATION_ERROR: 401,
  ACTIVITYPUB_AUTHORIZATION_ERROR: 403,
};

