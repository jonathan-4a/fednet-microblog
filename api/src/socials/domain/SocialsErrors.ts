// src/socials/domain/SocialsErrors.ts

import { DomainError } from "@shared";

/**
 * Thrown when a follow activity is invalid or missing required fields
 */
export class InvalidFollowActivityError extends DomainError {
  readonly errorCode = "SOCIALS_INVALID_FOLLOW_ACTIVITY";

  constructor(message = "Follow activity must have actor and object") {
    super(message);
  }
}

/**
 * Thrown when a user cannot be found in social operations
 */
export class UserNotFoundError extends DomainError {
  readonly errorCode = "SOCIALS_USER_NOT_FOUND";

  constructor(message = "User not found") {
    super(message);
  }
}

/**
 * Thrown when an internal server error occurs in social operations
 */
export class SocialsInternalServerError extends DomainError {
  readonly errorCode = "SOCIALS_INTERNAL_SERVER_ERROR";

  constructor(message = "An internal server error occurred") {
    super(message);
  }
}

