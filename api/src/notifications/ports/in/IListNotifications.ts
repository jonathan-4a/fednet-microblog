// src/notifications/ports/in/IListNotifications.ts

import type {
  ListNotificationsInput,
  ListNotificationsOutput,
} from "./Notifications.dto";

export interface IListNotifications {
  execute(input: ListNotificationsInput): Promise<ListNotificationsOutput>;
}
