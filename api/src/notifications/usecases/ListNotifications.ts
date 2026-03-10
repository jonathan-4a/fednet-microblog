// src/notifications/usecases/ListNotifications.ts

import type { IListNotifications } from "../ports/in/IListNotifications";
import type {
  ListNotificationsInput,
  ListNotificationsOutput,
} from "../ports/in/Notifications.dto";
import type { INotificationRepository } from "../ports/out/INotificationRepository";

export class ListNotifications implements IListNotifications {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    input: ListNotificationsInput,
  ): Promise<ListNotificationsOutput> {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.listByRecipient(
        input.recipientActor,
        input.limit,
        input.offset,
      ),
      this.notificationRepository.countUnreadByRecipient(input.recipientActor),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        recipientActor: n.recipientActor,
        actor: n.actor,
        type: n.type,
        objectId: n.objectId,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  }
}
