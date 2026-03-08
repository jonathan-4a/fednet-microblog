// src/notifications/adapters/events/NotificationActivityEvents.ts

import { BaseEvent } from "@shared";

export const NOTIFICATION_FOLLOW_DONE = "notification.follow.done";
export const NOTIFICATION_LIKE_DONE = "notification.like.done";
export const NOTIFICATION_REPOST_DONE = "notification.repost.done";
export const NOTIFICATION_REPLY_DONE = "notification.reply.done";

export interface FollowDonePayload {
  recipientActor: string;
  actor: string;
}

export interface LikeDonePayload {
  recipientActor: string;
  actor: string;
  objectId: string;
}

export interface RepostDonePayload {
  recipientActor: string;
  actor: string;
  objectId: string;
}

export interface ReplyDonePayload {
  recipientActor: string;
  actor: string;
  objectId: string | null;
}

export class FollowDoneEvent extends BaseEvent<FollowDonePayload> {
  constructor(payload: FollowDonePayload) {
    super(NOTIFICATION_FOLLOW_DONE, payload);
  }
}

export class LikeDoneEvent extends BaseEvent<LikeDonePayload> {
  constructor(payload: LikeDonePayload) {
    super(NOTIFICATION_LIKE_DONE, payload);
  }
}

export class RepostDoneEvent extends BaseEvent<RepostDonePayload> {
  constructor(payload: RepostDonePayload) {
    super(NOTIFICATION_REPOST_DONE, payload);
  }
}

export class ReplyDoneEvent extends BaseEvent<ReplyDonePayload> {
  constructor(payload: ReplyDonePayload) {
    super(NOTIFICATION_REPLY_DONE, payload);
  }
}
