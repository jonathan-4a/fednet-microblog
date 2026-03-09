// src/posts/domain/PostsErrors.ts

import { DomainError } from "@shared";

// Thrown when a post cannot be found
export class PostNotFoundError extends DomainError {
  readonly errorCode = "POST_NOT_FOUND";

  constructor(message = "Post not found") {
    super(message);
  }
}

// Thrown when post validation fails
export class PostValidationError extends DomainError {
  readonly errorCode = "POST_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}
