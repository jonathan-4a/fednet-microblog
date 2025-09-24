// src/auth/domain/AuthErrors.ts

import { DomainError } from "@shared";

// Use when a user is not logged in or has an invalid session
export class AuthenticationError extends DomainError {
  readonly errorCode = "AUTHENTICATION_ERROR";

  constructor(message = "Authentication failed") {
    super(message);
  }
}

// Use when credentials are not found for a user
export class CredentialsNotFoundError extends DomainError {
  readonly errorCode = "CREDENTIALS_NOT_FOUND";

  constructor(message = "Credentials not found") {
    super(message);
  }
}

// Use for validation errors in auth operations
export class AuthValidationError extends DomainError {
  readonly errorCode = "AUTH_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}

// Use when trying to create something that already exists (e.g. Username taken)
export class AuthConflictError extends DomainError {
  readonly errorCode = "AUTH_CONFLICT_ERROR";

  constructor(message = "Resource already exists") {
    super(message);
  }
}

// Use for valid inputs that violate business logic (e.g. Invalid Invite, Account Suspended)
export class AuthBusinessRuleError extends DomainError {
  readonly errorCode = "AUTH_BUSINESS_RULE_ERROR";

  constructor(message: string) {
    super(message);
  }
}

// Use for internal server errors in auth operations
export class AuthInternalServerError extends DomainError {
  readonly errorCode = "AUTH_INTERNAL_SERVER_ERROR";

  constructor(message = "An internal server error occurred") {
    super(message);
  }
}

