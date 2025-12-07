// src/apcore/handlers/HandleC2SCreateActivity.ts

import type { ICreatePost } from "@posts";
import type { C2SActivitySubmittedEvent } from "../domain/events/C2SActivitySubmittedEvent";

export class HandleC2SCreateActivity {
  constructor(private readonly createPost: ICreatePost) {}

  async handle(event: C2SActivitySubmittedEvent): Promise<void> {
    const { username, activity, host, protocol } = event.payload;

    const activityType =
      typeof activity.type === "string" ? activity.type : String(activity?.type);
    if (activityType !== "Create") {
      return;
    }

    const obj = activity.object;
    if (!obj || typeof obj !== "object") {
      return;
    }

    const note = obj as Record<string, unknown>;
    const noteType =
      typeof note.type === "string" ? note.type : String(note?.type);
    if (noteType !== "Note") {
      return;
    }

    const content =
      typeof note.content === "string" ? note.content : String(note?.content ?? "");
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    const inReplyTo =
      typeof note.inReplyTo === "string" && note.inReplyTo
        ? note.inReplyTo
        : undefined;

    const actorUrl =
      typeof activity.actor === "string"
        ? activity.actor
        : `${protocol}://${host}/u/${username}`;

    await this.createPost.execute({
      username,
      content: trimmedContent,
      inReplyTo: inReplyTo ?? null,
      host,
      protocol,
      actor: actorUrl,
    });
  }
}

