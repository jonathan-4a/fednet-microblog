// src/posts/domain/events/PostCreatedEvent.ts

import { BaseEvent } from "@shared";

export interface PostCreatedPayload {
  guid: string;
  username: string;
  actorUrl: string;
  createActivity: Record<string, unknown>;
}

export class PostCreatedEvent extends BaseEvent<PostCreatedPayload> {
  constructor(payload: PostCreatedPayload) {
    super("post.created", payload);
  }
}

