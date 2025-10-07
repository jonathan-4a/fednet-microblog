// src/users/domain/UserErrors.ts

import { DomainError } from "@shared";

// Thrown when a user cannot be found
export class NotFoundError extends DomainError {
  readonly errorCode = "USER_NOT_FOUND";

  constructor(message = "User not found") {
    super(message);
  }
}

// Thrown when a user already exists
export class UserAlreadyExistsError extends DomainError {
  readonly errorCode = "USER_ALREADY_EXISTS";

  constructor(message = "User already exists") {
    super(message);
  }
}

// Thrown when validation fails
export class ValidationError extends DomainError {
  readonly errorCode = "USER_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}

