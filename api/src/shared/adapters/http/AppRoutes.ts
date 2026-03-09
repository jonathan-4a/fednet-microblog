// src/shared/adapters/http/AppRoutes.ts

import { Hono } from "hono";
import type { Context, Next } from "hono";
import { AppController } from "./AppController";
import { ProxyController } from "./ProxyController";
import type { IGetServerSettings } from "@shared/ports/in/IGetServerSettings";
import { AppUrls } from "./AppUrls";
import type { IGetRemoteResource } from "@apcore";

export type AuthMiddleware = (c: Context, next: Next) => Promise<void> | void;

export function createAppRoutes(
  getServerSettings: IGetServerSettings,
  protocol: string,
  domain: string,
  port: string,
  proxyAuthMiddleware?: AuthMiddleware,
  getRemoteResource?: IGetRemoteResource,
) {
  const app = new Hono();

  const controller = new AppController(
    getServerSettings,
    protocol,
    domain,
    port,
  );
  const proxyController = new ProxyController(getRemoteResource);

  app.get(AppUrls.health, (c) => controller.getHealth(c));

  app.get(AppUrls.config, (c) => controller.getConfig(c));

  app.get(AppUrls.docs, (c) => controller.getApiDocs(c));

  app.get(AppUrls.docsOpenapi, (c) => controller.getOpenApiSpec(c));

  if (proxyAuthMiddleware) {
    app.get(AppUrls.proxy, proxyAuthMiddleware, (c) =>
      proxyController.proxy(c),
    );
  } else {
    app.get(AppUrls.proxy, (c) => proxyController.proxy(c));
  }

  return app;
}
