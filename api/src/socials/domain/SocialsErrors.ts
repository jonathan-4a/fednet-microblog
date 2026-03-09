// src/socials/domain/SocialsErrors.ts

import { DomainError } from "@shared";

export class InvalidFollowActivityError extends DomainError {
  readonly errorCode = "SOCIALS_INVALID_FOLLOW_ACTIVITY";

  constructor(message = "Follow activity must have actor and object") {
    super(message);
  }
}

export class UserNotFoundError extends DomainError {
  readonly errorCode = "SOCIALS_USER_NOT_FOUND";

  constructor(message = "User not found") {
    super(message);
  }
}

export class SocialsInternalServerError extends DomainError {
  readonly errorCode = "SOCIALS_INTERNAL_SERVER_ERROR";

  constructor(message = "An internal server error occurred") {
    super(message);
  }
}
