// src/apcore/domain/ActivityPubErrors.ts

import { DomainError } from "@shared";

// Thrown when a requested resource is invalid or malformed
export class InvalidResourceError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_INVALID_RESOURCE";

  constructor(message = "Invalid resource") {
    super(message);
  }
}

// Thrown when server configuration is missing or invalid
export class ConfigurationError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_CONFIGURATION_ERROR";

  constructor(message = "Configuration error") {
    super(message);
  }
}

// Thrown when an activity does not contain an actor
export class MissingActorError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_MISSING_ACTOR";

  constructor(message = "Activity must have an actor") {
    super(message);
  }
}

// Thrown when an actor document does not expose an inbox
export class InboxNotFoundError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_INBOX_NOT_FOUND";

  constructor(message = "No inbox found in actor document") {
    super(message);
  }
}

// Thrown when an upstream fetch fails.
// remoteStatus and remoteBody are the raw response from the remote server (pass-through, no translation).
export class FetchError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_FETCH_ERROR";
  readonly remoteStatus?: number;
  readonly remoteBody?: string;

  constructor(message: string, remoteStatus?: number, remoteBody?: string) {
    super(message);
    this.remoteStatus = remoteStatus;
    this.remoteBody = remoteBody;
  }
}

// Thrown when an actor URL is invalid
export class InvalidActorUrlError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_INVALID_ACTOR_URL";

  constructor(message: string) {
    super(message);
  }
}

// Thrown when a resource cannot be found in ActivityPub operations
export class NotFoundError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_NOT_FOUND";

  constructor(message = "Resource not found") {
    super(message);
  }
}

// Thrown when validation fails in ActivityPub operations
export class ValidationError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}

// Thrown when an internal server error occurs in ActivityPub operations
export class InternalServerError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_INTERNAL_SERVER_ERROR";

  constructor(message = "An internal server error occurred") {
    super(message);
  }
}

// Thrown when authentication fails in ActivityPub operations
export class AuthenticationError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_AUTHENTICATION_ERROR";

  constructor(message = "Authentication failed") {
    super(message);
  }
}

// Thrown when authorization fails in ActivityPub operations
export class AuthorizationError extends DomainError {
  readonly errorCode = "ACTIVITYPUB_AUTHORIZATION_ERROR";

  constructor(message = "Not authorized") {
    super(message);
  }
}
