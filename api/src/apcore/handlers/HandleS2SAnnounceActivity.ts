// src/apcore/handlers/HandleS2SAnnounceActivity.ts

import type { IAnnouncesRepository } from "@posts";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

/**
 * Handles incoming Announce (repost) activities from remote servers (S2S).
 * Stores reposts so they appear in GetPostShares and in the outbox when we serve the actor's outbox.
 * Object can be the note URL (string) or a reference; we store by note_id + actor.
 */
export class HandleS2SAnnounceActivity {
  constructor(private readonly announcesRepository: IAnnouncesRepository) {}

  async handle(event: ActivityReceivedEvent): Promise<void> {
    const { activity } = event.payload;

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
      typeof activity.actor === "string" ? activity.actor : null;
    if (!actorUrl) {
      return;
    }

    const published =
      typeof activity.published === "string"
        ? activity.published
        : new Date().toISOString();
    const createdAt = Math.floor(new Date(published).getTime() / 1000);

    await this.announcesRepository.create(noteId, actorUrl, createdAt);
  }
}

