// src/auth/adapters/http/AuthRoutes.ts

import { Hono } from "hono";
import { AuthUrls } from "./AuthUrls";
import { AuthController } from "./AuthController";

import type { ILoginUser } from "../../ports/in/ILoginUser";
import type { ILogoutUser } from "../../ports/in/ILogoutUser";
import type { IRegisterUser } from "../../ports/in/IRegisterUser";

export function createAuthRoutes(
  loginUser: ILoginUser,
  logoutUser: ILogoutUser,
  registerUser: IRegisterUser,
  domain: string,
  protocol: string,
) {
  const app = new Hono();
  const controller = new AuthController(
    loginUser,
    logoutUser,
    registerUser,
    domain,
    protocol,
  );

  app.post(AuthUrls.register, (c) => controller.register(c));
  app.post(AuthUrls.login, (c) => controller.login(c));
  app.post(AuthUrls.logout, (c) => controller.logout(c));

  return app;
}
