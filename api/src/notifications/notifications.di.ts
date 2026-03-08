// src/notifications/notifications.di.ts
import type { Kysely } from "kysely";
import type { NotificationsTable } from "./adapters/db/models/NotificationSchema";
import type { INotificationRepository } from "./ports/out/INotificationRepository";
import { NotificationRepository } from "./adapters/db/repository/NotificationRepository";
import { ListNotifications } from "./usecases/ListNotifications";
import { MarkNotificationRead } from "./usecases/MarkNotificationRead";
import { MarkAllNotificationsRead } from "./usecases/MarkAllNotificationsRead";
import { createNotificationsRoutes as createNotificationsRoutesFactory } from "./adapters/http/NotificationsRoutes";
import type { AuthMiddleware } from "./adapters/http/NotificationsRoutes";

/** Build notification repo. Call from composition root with narrowed db. */
export function createNotificationRepository(
  db: Kysely<{ notifications: NotificationsTable }>,
): NotificationRepository {
  return new NotificationRepository(db);
}

export function createListNotifications(
  notificationRepository: INotificationRepository,
) {
  return new ListNotifications(notificationRepository);
}

export function createMarkNotificationRead(
  notificationRepository: INotificationRepository,
) {
  return new MarkNotificationRead(notificationRepository);
}

export function createMarkAllNotificationsRead(
  notificationRepository: INotificationRepository,
) {
  return new MarkAllNotificationsRead(notificationRepository);
}

export function createNotificationsRoutes(
  notificationRepository: INotificationRepository,
  authMiddleware: AuthMiddleware,
  host: string,
  protocol: string,
) {
  const listNotifications = createListNotifications(notificationRepository);
  const markNotificationRead = createMarkNotificationRead(
    notificationRepository,
  );
  const markAllNotificationsRead = createMarkAllNotificationsRead(
    notificationRepository,
  );
  return createNotificationsRoutesFactory(
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    authMiddleware,
    host,
    protocol,
  );
}
