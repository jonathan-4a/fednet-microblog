// src/apcore/handlers/HandleS2SAnnounceActivity.ts

import type { IAnnouncesRepository } from "@posts";
import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

export class HandleS2SAnnounceActivity {
  constructor(
    private readonly announcesRepository: IAnnouncesRepository,
    private readonly ourOrigin: string,
    private readonly resolveNoteAuthorActor: IResolveNoteAuthorActor | null = null,
    private readonly notify: INotificationActivityEmitter | null = null,
  ) {}

  async handle(event: ActivityReceivedEvent): Promise<void> {
    const { activity } = event.payload;

    const activityType =
      typeof activity.type === "string"
        ? activity.type
        : String(activity?.type);
    if (activityType !== "Announce") {
      return;
    }

    const object = activity.object;
    const noteId =
      typeof object === "string"
        ? object
        : object &&
            typeof object === "object" &&
            typeof (object as Record<string, unknown>).id === "string"
          ? ((object as Record<string, unknown>).id as string)
          : null;

    if (!noteId) {
      return;
    }

    const actorUrl = typeof activity.actor === "string" ? activity.actor : null;
    if (!actorUrl) {
      return;
    }

    const published =
      typeof activity.published === "string"
        ? activity.published
        : new Date().toISOString();
    const createdAt = Math.floor(new Date(published).getTime() / 1000);

    await this.announcesRepository.create(noteId, actorUrl, createdAt);

    const isRemote = new URL(actorUrl).origin !== this.ourOrigin;
    if (isRemote && this.resolveNoteAuthorActor && this.notify) {
      const recipientActor = await this.resolveNoteAuthorActor.resolve(noteId);
      if (recipientActor && recipientActor !== actorUrl) {
        await this.notify.onRepostDone(recipientActor, actorUrl, noteId);
      }
    }
  }
}
