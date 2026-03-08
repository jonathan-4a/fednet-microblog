// src/notifications/usecases/MarkAllNotificationsRead.ts

import type { IMarkAllNotificationsRead } from "../ports/in/IMarkAllNotificationsRead";
import type { MarkAllNotificationsReadInput } from "../ports/in/Notifications.dto";
import type { INotificationRepository } from "../ports/out/INotificationRepository";

export class MarkAllNotificationsRead implements IMarkAllNotificationsRead {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: MarkAllNotificationsReadInput): Promise<number> {
    return this.notificationRepository.markAllAsRead(input.recipientActor);
  }
}
