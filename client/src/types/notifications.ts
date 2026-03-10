// src/types/notifications.ts

export type NotificationType = 'follow' | 'like' | 'reply' | 'repost'

export interface Notification {
  id: number
  recipientActor: string
  actor: string
  type: NotificationType
  objectId: string | null
  readAt: number | null
  createdAt: number
}

export interface NotificationsListResponse {
  notifications: Notification[]
  unreadCount: number
}
