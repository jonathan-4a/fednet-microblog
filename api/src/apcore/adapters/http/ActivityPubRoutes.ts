// src/apcore/adapters/http/ActivityPubRoutes.ts

import type { Context, Next } from "hono";
import { Hono } from "hono";
import { ActivityPubUrls } from "./ActivityPubUrls";
import { ActivityPubController } from "./ActivityPubController";
import type { AuthTokenPayload } from "@auth";

import type { IGetWebFinger } from "@apcore/ports/in/IGetWebFinger";
import type { IGetActor } from "@apcore/ports/in/IGetActor";
import type { IGetOutbox } from "@apcore/ports/in/IGetOutbox";
import type { IDispatchS2SActivityEvent } from "@apcore/ports/in/IDispatchS2SActivityEvent";
import type { IDispatchC2SActivityEvent } from "@apcore/ports/in/IDispatchC2SActivityEvent";

export type AuthMiddleware = (
  c: Context,
  next: Next,
) => Promise<Response | void>;

export function createActivityPubRoutes(
  getWebFinger: IGetWebFinger,
  getActor: IGetActor,
  getOutbox: IGetOutbox,
  dispatchS2SActivityEvent: IDispatchS2SActivityEvent,
  dispatchC2SActivityEvent: IDispatchC2SActivityEvent,
  host: string,
  protocol: string,
  domain: string,
  postOutboxAuthMiddleware?: AuthMiddleware,
) {
  const app = new Hono<{
    Variables: {
      user?: AuthTokenPayload;
    };
  }>();
  const controller = new ActivityPubController(
    getWebFinger,
    getActor,
    getOutbox,
    dispatchS2SActivityEvent,
    dispatchC2SActivityEvent,
    host,
    protocol,
    domain,
  );

  app.get(ActivityPubUrls.webfinger, (c) => controller.webfinger(c));
  app.get(ActivityPubUrls.actor, (c) => controller.getActor(c));
  app.get(ActivityPubUrls.outbox, (c) => controller.getOutbox(c));
  app.get(ActivityPubUrls.inbox, (c) => controller.getInbox(c));
  app.post(ActivityPubUrls.inbox, (c) => controller.postInbox(c));
  if (postOutboxAuthMiddleware) {
    app.post(ActivityPubUrls.outbox, postOutboxAuthMiddleware, (c) =>
      controller.postOutbox(c),
    );
  } else {
    app.post(ActivityPubUrls.outbox, (c) => controller.postOutbox(c));
  }

  return app;
}
