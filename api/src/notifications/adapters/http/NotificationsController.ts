// src/notifications/adapters/http/NotificationsController.ts

import type { Context } from "hono";
import type { AuthTokenPayload } from "@auth";
import type { IListNotifications } from "../../ports/in/IListNotifications";
import type { IMarkNotificationRead } from "../../ports/in/IMarkNotificationRead";
import type { IMarkAllNotificationsRead } from "../../ports/in/IMarkAllNotificationsRead";

type AppContext = Context<{
  Variables: {
    user: AuthTokenPayload;
  };
}>;

export class NotificationsController {
  constructor(
    private readonly listNotifications: IListNotifications,
    private readonly markNotificationRead: IMarkNotificationRead,
    private readonly markAllNotificationsRead: IMarkAllNotificationsRead,
    private readonly host: string,
    private readonly protocol: string,
  ) {}

  async list(c: AppContext) {
    const user = c.get("user");
    const actorUrl = `${this.protocol}://${this.host}/u/${user.username}`;
    const limit = Math.min(
      parseInt(c.req.query("limit") ?? "20", 10) || 20,
      50,
    );
    const offset = parseInt(c.req.query("offset") ?? "0", 10) || 0;

    const result = await this.listNotifications.execute({
      recipientActor: actorUrl,
      limit,
      offset,
    });

    return c.json(result);
  }

  async markRead(c: AppContext) {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) {
      return c.json({ message: "Invalid notification id" }, 400);
    }

    const actorUrl = `${this.protocol}://${this.host}/u/${user.username}`;
    const ok = await this.markNotificationRead.execute({
      id,
      recipientActor: actorUrl,
    });

    if (!ok) {
      return c.json({ message: "Notification not found" }, 404);
    }
    return c.json({ ok: true });
  }

  async markAllRead(c: AppContext) {
    const user = c.get("user");
    const actorUrl = `${this.protocol}://${this.host}/u/${user.username}`;
    const count = await this.markAllNotificationsRead.execute({
      recipientActor: actorUrl,
    });
    return c.json({ marked: count });
  }
}
