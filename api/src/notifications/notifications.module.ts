// src/notifications/notifications.module.ts

export { createNotificationSchema } from "./adapters/db/models/NotificationSchema";
export type { NotificationsTable } from "./adapters/db/models/NotificationSchema";
export { NotificationRepository } from "./adapters/db/repository/NotificationRepository";
export { ListNotifications } from "./usecases/ListNotifications";
export { MarkNotificationRead } from "./usecases/MarkNotificationRead";
export { MarkAllNotificationsRead } from "./usecases/MarkAllNotificationsRead";
export {
  createNotificationRepository,
  createListNotifications,
  createMarkNotificationRead,
  createMarkAllNotificationsRead,
  createNotificationsRoutes,
} from "./notifications.di";
export { createNotificationActivityEmitter } from "./adapters/events/NotificationActivityEmitter";
export { createNotificationActivityListener } from "./adapters/events/NotificationActivityListener";
export type { INotificationRepository } from "./ports/out/INotificationRepository";
export type { NotificationRecord } from "./ports/out/INotificationRepository";
export type { IListNotifications } from "./ports/in/IListNotifications";
export type { IMarkNotificationRead } from "./ports/in/IMarkNotificationRead";
export type { IMarkAllNotificationsRead } from "./ports/in/IMarkAllNotificationsRead";
