// src/notifications/usecases/MarkNotificationRead.ts

import type { IMarkNotificationRead } from "../ports/in/IMarkNotificationRead";
import type { MarkNotificationReadInput } from "../ports/in/Notifications.dto";
import type { INotificationRepository } from "../ports/out/INotificationRepository";

export class MarkNotificationRead implements IMarkNotificationRead {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: MarkNotificationReadInput): Promise<boolean> {
    return this.notificationRepository.markAsRead(
      input.id,
      input.recipientActor,
    );
  }
}
