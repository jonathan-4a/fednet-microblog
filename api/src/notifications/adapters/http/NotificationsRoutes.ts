// src/notifications/adapters/http/NotificationsRoutes.ts

import type { Context, Next } from "hono";
import { Hono } from "hono";
import { NotificationsUrls } from "./NotificationsUrls";
import { NotificationsController } from "./NotificationsController";
import type { IListNotifications } from "../../ports/in/IListNotifications";
import type { IMarkNotificationRead } from "../../ports/in/IMarkNotificationRead";
import type { IMarkAllNotificationsRead } from "../../ports/in/IMarkAllNotificationsRead";

type Variables = {
  user: import("@auth").AuthTokenPayload;
};

export type AuthMiddleware = (
  c: Context,
  next: Next,
) => Promise<Response | void>;

export function createNotificationsRoutes(
  listNotifications: IListNotifications,
  markNotificationRead: IMarkNotificationRead,
  markAllNotificationsRead: IMarkAllNotificationsRead,
  authMiddleware: AuthMiddleware,
  host: string,
  protocol: string,
) {
  const app = new Hono<{ Variables: Variables }>();

  app.use("*", authMiddleware);

  const controller = new NotificationsController(
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    host,
    protocol,
  );

  app.get(NotificationsUrls.list, (c) => controller.list(c));
  app.patch(NotificationsUrls.markAllRead, (c) => controller.markAllRead(c));
  app.patch(NotificationsUrls.markRead, (c) => controller.markRead(c));

  return app;
}
