// src/notifications/adapters/events/NotificationActivityEmitter.ts

import type { IEventBus } from "@shared";
import {
  FollowDoneEvent,
  LikeDoneEvent,
  RepostDoneEvent,
  ReplyDoneEvent,
} from "./NotificationActivityEvents";

export function createNotificationActivityEmitter(eventBus: IEventBus) {
  return {
    onFollowDone(recipientActor: string, actor: string): void {
      eventBus.emit(new FollowDoneEvent({ recipientActor, actor }));
    },
    onLikeDone(recipientActor: string, actor: string, objectId: string): void {
      eventBus.emit(new LikeDoneEvent({ recipientActor, actor, objectId }));
    },
    onRepostDone(
      recipientActor: string,
      actor: string,
      objectId: string,
    ): void {
      eventBus.emit(new RepostDoneEvent({ recipientActor, actor, objectId }));
    },
    onReplyDone(
      recipientActor: string,
      actor: string,
      objectId: string | null,
    ): void {
      eventBus.emit(new ReplyDoneEvent({ recipientActor, actor, objectId }));
    },
  };
}
