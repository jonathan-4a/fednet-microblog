// src/auth/domain/AuthErrors.ts

import { DomainError } from "@shared";

export class AuthenticationError extends DomainError {
  readonly errorCode = "AUTHENTICATION_ERROR";

  constructor(message = "Authentication failed") {
    super(message);
  }
}

export class CredentialsNotFoundError extends DomainError {
  readonly errorCode = "CREDENTIALS_NOT_FOUND";

  constructor(message = "Credentials not found") {
    super(message);
  }
}

export class AuthValidationError extends DomainError {
  readonly errorCode = "AUTH_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}

export class AuthConflictError extends DomainError {
  readonly errorCode = "AUTH_CONFLICT_ERROR";

  constructor(message = "Resource already exists") {
    super(message);
  }
}

export class AuthBusinessRuleError extends DomainError {
  readonly errorCode = "AUTH_BUSINESS_RULE_ERROR";

  constructor(message: string) {
    super(message);
  }
}

export class AuthInternalServerError extends DomainError {
  readonly errorCode = "AUTH_INTERNAL_SERVER_ERROR";

  constructor(message = "An internal server error occurred") {
    super(message);
  }
}
