// src/admin/domain/AdminErrors.ts

import { DomainError } from "@shared";

// Thrown when a resource cannot be found in admin operations
export class AdminNotFoundError extends DomainError {
  readonly errorCode = "ADMIN_NOT_FOUND";

  constructor(message = "Resource not found") {
    super(message);
  }
}

// Thrown when validation fails in admin operations
export class AdminValidationError extends DomainError {
  readonly errorCode = "ADMIN_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}

// Thrown when business rules are violated in admin operations
export class AdminBusinessRuleError extends DomainError {
  readonly errorCode = "ADMIN_BUSINESS_RULE_ERROR";

  constructor(message: string) {
    super(message);
  }
}

// Thrown when an internal server error occurs in admin operations
export class AdminInternalServerError extends DomainError {
  readonly errorCode = "ADMIN_INTERNAL_SERVER_ERROR";

  constructor(message = "An internal server error occurred") {
    super(message);
  }
}
