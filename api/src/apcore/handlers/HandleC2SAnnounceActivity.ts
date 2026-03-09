// src/apcore/handlers/HandleC2SAnnounceActivity.ts

import type { IAnnouncesRepository } from "@posts";
import type { IFederationDelivery } from "../ports/out/IFederationDelivery";
import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";
import type { C2SActivitySubmittedEvent } from "../domain/events/C2SActivitySubmittedEvent";

export class HandleC2SAnnounceActivity {
  constructor(
    private readonly announcesRepository: IAnnouncesRepository,
    private readonly federationDelivery: IFederationDelivery,
    private readonly resolveNoteAuthorActor: IResolveNoteAuthorActor | null = null,
    private readonly notify: INotificationActivityEmitter | null = null,
  ) {}

  async handle(event: C2SActivitySubmittedEvent): Promise<void> {
    const { username, activity, host, protocol } = event.payload;

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

    const actorUrl =
      typeof activity.actor === "string"
        ? activity.actor
        : `${protocol}://${host}/u/${username}`;

    const authorActor =
      await this.federationDelivery.getAuthorActorFromNote(noteId);
    if (!authorActor) {
      throw new Error("Could not resolve note author for Announce delivery");
    }
    await this.federationDelivery.sendToInbox(authorActor, activity);

    const published =
      typeof activity.published === "string"
        ? activity.published
        : new Date().toISOString();
    const createdAt = Math.floor(new Date(published).getTime() / 1000);

    await this.announcesRepository.create(noteId, actorUrl, createdAt);

    if (this.resolveNoteAuthorActor && this.notify) {
      const recipientActor = await this.resolveNoteAuthorActor.resolve(noteId);
      if (recipientActor && recipientActor !== actorUrl) {
        await this.notify.onRepostDone(recipientActor, actorUrl, noteId);
      }
    }
  }
}
