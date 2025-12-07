// src/apcore/handlers/HandleC2SAnnounceActivity.ts

import type { IAnnouncesRepository } from "@posts";
import type { C2SActivitySubmittedEvent } from "../domain/events/C2SActivitySubmittedEvent";

/**
 * Handles Announce (repost) activities from the client (C2S).
 * Persists reposts so they appear in outbox and in GetPostShares.
 * Supports reposting local or remote notes (object is the note URL).
 */
export class HandleC2SAnnounceActivity {
  constructor(private readonly announcesRepository: IAnnouncesRepository) {}

  async handle(event: C2SActivitySubmittedEvent): Promise<void> {
    const { username, activity, host, protocol } = event.payload;

    const activityType =
      typeof activity.type === "string" ? activity.type : String(activity?.type);
    if (activityType !== "Announce") {
      return;
    }

    const object = activity.object;
    const noteId =
      typeof object === "string"
        ? object
        : object && typeof object === "object" && typeof (object as Record<string, unknown>).id === "string"
          ? (object as Record<string, unknown>).id as string
          : null;

    if (!noteId) {
      return;
    }

    const actorUrl =
      typeof activity.actor === "string"
        ? activity.actor
        : `${protocol}://${host}/u/${username}`;

    const published =
      typeof activity.published === "string"
        ? activity.published
        : new Date().toISOString();
    const createdAt = Math.floor(new Date(published).getTime() / 1000);

    await this.announcesRepository.create(noteId, actorUrl, createdAt);
  }
}

