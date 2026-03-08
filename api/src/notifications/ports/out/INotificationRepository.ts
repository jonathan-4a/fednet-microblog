// src/notifications/ports/out/INotificationRepository.ts

export interface NotificationRecord {
  id: number;
  recipientActor: string;
  actor: string;
  type: "follow" | "like" | "reply" | "repost";
  objectId: string | null;
  readAt: number | null;
  createdAt: number;
}

export interface INotificationRepository {
  create(record: {
    recipientActor: string;
    actor: string;
    type: "follow" | "like" | "reply" | "repost";
    objectId?: string | null;
  }): Promise<NotificationRecord>;

  listByRecipient(
    recipientActor: string,
    limit: number,
    offset: number,
  ): Promise<NotificationRecord[]>;

  countUnreadByRecipient(recipientActor: string): Promise<number>;

  markAsRead(id: number, recipientActor: string): Promise<boolean>;

  markAllAsRead(recipientActor: string): Promise<number>;
}
