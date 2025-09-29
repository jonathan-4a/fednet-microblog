// src/auth/adapters/http/AuthGuard.ts

import type { Context, Next } from "hono";
import type { IJwtTokenService } from "../../ports/out/services/IJwtTokenService";

export class AuthGuard {
  constructor(private readonly jwtTokenService: IJwtTokenService) {}

  async authenticate(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtTokenService.verifyAuthToken(token);

      if (!payload) {
        return c.json({ error: "Invalid token" }, 401);
      }

      c.set("user", payload);
      await next();
    } catch {
      return c.json({ error: "Invalid token" }, 401);
    }
  }
}

