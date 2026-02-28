// src/globalExceptionHandler.ts
// If the error is DomainError: map errorCode to HTTP status and respond.
// If the error is Hono HTTPException: respond with its status. Otherwise: default 500.

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { DomainError } from "@shared";
import { errorCodeToStatus as usersErrorMap } from "./users/adapters/http/ErrorMapper";
import { errorCodeToStatus as adminErrorMap } from "./admin/adapters/http/ErrorMapper";
import { errorCodeToStatus as postsErrorMap } from "./posts/adapters/http/ErrorMapper";
import { errorCodeToStatus as authErrorMap } from "./auth/adapters/http/ErrorMapper";
import { errorCodeToStatus as activityPubErrorMap } from "./apcore/adapters/http/ErrorMapper";
import { errorCodeToStatus as socialsErrorMap } from "./socials/adapters/http/ErrorMapper";

const errorMapper: Record<string, number> = {
  ...usersErrorMap,
  ...adminErrorMap,
  ...postsErrorMap,
  ...authErrorMap,
  ...activityPubErrorMap,
  ...socialsErrorMap,
} as Record<string, number>;

export function globalExceptionHandler(err: Error, c: Context) {
  if (err instanceof DomainError) {
    const errorCode = err.errorCode;
    const status = errorMapper[errorCode] ?? 500;
    return c.json(
      {
        error: errorCode,
        message: err.message,
      },
      status as Parameters<Context["json"]>[1],
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: "HTTP_EXCEPTION", message: err.message },
      err.status as Parameters<Context["json"]>[1],
    );
  }

  if (err instanceof SyntaxError || (err.message && err.message.includes("JSON Parse error"))) {
    return c.json(
      { error: "BAD_REQUEST", message: "Invalid JSON" },
      400,
    );
  }

  console.error("[Unhandled Error]:", err.message, err);
  return c.json(
    { error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    500,
  );
}


