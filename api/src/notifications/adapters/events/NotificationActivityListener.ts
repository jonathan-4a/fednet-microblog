// src/notifications/adapters/events/NotificationActivityListener.ts

import type { IEventBus } from "@shared";
import type { INotificationRepository } from "../../ports/out/INotificationRepository";
import {
  NOTIFICATION_FOLLOW_DONE,
  NOTIFICATION_LIKE_DONE,
  NOTIFICATION_REPOST_DONE,
  NOTIFICATION_REPLY_DONE,
  FollowDoneEvent,
  LikeDoneEvent,
  RepostDoneEvent,
  ReplyDoneEvent,
} from "./NotificationActivityEvents";

export function createNotificationActivityListener(
  eventBus: IEventBus,
  notificationRepository: INotificationRepository,
): void {
  eventBus.on<FollowDoneEvent>(NOTIFICATION_FOLLOW_DONE, async (event) => {
    const { recipientActor, actor } = event.payload;
    try {
      await notificationRepository.create({
        recipientActor,
        actor,
        type: "follow",
      });
    } catch (err) {
      console.error(
        "[NotificationActivityListener] follow failed:",
        (err as Error).message,
      );
    }
  });

  eventBus.on<LikeDoneEvent>(NOTIFICATION_LIKE_DONE, async (event) => {
    const { recipientActor, actor, objectId } = event.payload;
    try {
      await notificationRepository.create({
        recipientActor,
        actor,
        type: "like",
        objectId,
      });
    } catch (err) {
      console.error(
        "[NotificationActivityListener] like failed:",
        (err as Error).message,
      );
    }
  });

  eventBus.on<RepostDoneEvent>(NOTIFICATION_REPOST_DONE, async (event) => {
    const { recipientActor, actor, objectId } = event.payload;
    try {
      await notificationRepository.create({
        recipientActor,
        actor,
        type: "repost",
        objectId,
      });
    } catch (err) {
      console.error(
        "[NotificationActivityListener] repost failed:",
        (err as Error).message,
      );
    }
  });

  eventBus.on<ReplyDoneEvent>(NOTIFICATION_REPLY_DONE, async (event) => {
    const { recipientActor, actor, objectId } = event.payload;
    try {
      await notificationRepository.create({
        recipientActor,
        actor,
        type: "reply",
        objectId: objectId ?? undefined,
      });
    } catch (err) {
      console.error(
        "[NotificationActivityListener] reply failed:",
        (err as Error).message,
      );
    }
  });
}
