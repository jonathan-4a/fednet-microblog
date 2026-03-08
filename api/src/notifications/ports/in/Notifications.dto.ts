// src/notifications/ports/in/Notifications.dto.ts

export interface ListNotificationsInput {
  recipientActor: string;
  limit: number;
  offset: number;
}

export interface ListNotificationsOutput {
  notifications: Array<{
    id: number;
    recipientActor: string;
    actor: string;
    type: "follow" | "like" | "reply" | "repost";
    objectId: string | null;
    readAt: number | null;
    createdAt: number;
  }>;
  unreadCount: number;
}

export interface MarkNotificationReadInput {
  id: number;
  recipientActor: string;
}

export interface MarkAllNotificationsReadInput {
  recipientActor: string;
}
