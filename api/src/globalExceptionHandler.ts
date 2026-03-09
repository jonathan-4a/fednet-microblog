// src/globalExceptionHandler.ts
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { DomainError } from "@shared";
import { FetchError } from "./apcore/domain/ActivityPubErrors";
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

type JsonStatus = Parameters<Context["json"]>[1];

export function globalExceptionHandler(err: Error, c: Context) {
  if (err instanceof FetchError && err.remoteStatus != null) {
    if (err.remoteBody != null && err.remoteBody !== "") {
      try {
        const body = JSON.parse(err.remoteBody) as Record<string, unknown>;
        return c.json(body, err.remoteStatus as JsonStatus);
      } catch {
        return c.json(
          { error: err.remoteBody },
          err.remoteStatus as JsonStatus,
        );
      }
    }
    return c.json(
      { error: err.errorCode, message: err.message },
      err.remoteStatus as JsonStatus,
    );
  }
  if (err instanceof FetchError) {
    return c.json({ error: err.errorCode, message: err.message }, 502);
  }

  if (err instanceof DomainError) {
    const errorCode = err.errorCode;
    const status = errorMapper[errorCode] ?? 500;
    return c.json(
      { error: errorCode, message: err.message },
      status as JsonStatus,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: "HTTP_EXCEPTION", message: err.message },
      err.status as JsonStatus,
    );
  }

  if (
    err instanceof SyntaxError ||
    (err.message && err.message.includes("JSON Parse error"))
  ) {
    return c.json(
      { error: "BAD_REQUEST", message: "Invalid JSON" },
      400 as JsonStatus,
    );
  }

  console.error("[Unhandled Error]:", err.message, err);
  return c.json(
    { error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    500 as JsonStatus,
  );
}
