// src/apcore/handlers/HandleC2SLikeActivity.ts

import type { ILikesRepository } from "@posts";
import type { IFederationDelivery } from "../ports/out/IFederationDelivery";
import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";
import type { C2SActivitySubmittedEvent } from "../domain/events/C2SActivitySubmittedEvent";

function getNoteId(object: unknown): string | undefined {
  if (typeof object === "string") return object;
  if (
    object &&
    typeof object === "object" &&
    typeof (object as Record<string, unknown>).id === "string"
  ) {
    return (object as Record<string, unknown>).id as string;
  }
  return undefined;
}

export class HandleC2SLikeActivity {
  constructor(
    private readonly federationDelivery: IFederationDelivery,
    private readonly likesRepository: ILikesRepository,
    private readonly ourOrigin: string,
    private readonly resolveNoteAuthorActor: IResolveNoteAuthorActor,
    private readonly notify: INotificationActivityEmitter | null,
  ) {}

  async handle(event: C2SActivitySubmittedEvent): Promise<void> {
    const { username, activity, host, protocol, responseCallback } =
      event.payload;

    const activityType =
      typeof activity.type === "string"
        ? activity.type
        : String(activity?.type);
    const actorUrl = `${protocol}://${host}/u/${username}`;

    if (activityType === "Like") {
      const noteId = getNoteId(activity.object);
      if (!noteId) return;

      try {
        const authorActor =
          await this.federationDelivery.getAuthorActorFromNote(noteId);
        if (!authorActor)
          throw new Error("Could not resolve note author for Like delivery");

        await this.federationDelivery.sendToInbox(authorActor, activity);

        const isRemoteAuthor = !authorActor.startsWith(this.ourOrigin);
        if (isRemoteAuthor) {
          await this.likesRepository.createLike(noteId, actorUrl);

          const recipientActor =
            await this.resolveNoteAuthorActor.resolve(noteId);
          if (this.notify && recipientActor && recipientActor !== actorUrl) {
            await this.notify.onLikeDone(recipientActor, actorUrl, noteId);
          }
        }
        responseCallback?.();
      } catch (err) {
        console.error(
          "[HandleC2SLikeActivity] Like delivery or save failed:",
          (err as Error).message,
        );
        responseCallback?.(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
      return;
    }

    if (activityType === "Undo") {
      const obj = activity.object as Record<string, unknown> | undefined;
      if (obj?.type === "Like") {
        const noteId = getNoteId(obj.object);
        if (!noteId) return;

        try {
          const authorActor =
            await this.federationDelivery.getAuthorActorFromNote(noteId);
          if (authorActor)
            await this.federationDelivery.sendToInbox(authorActor, activity);
          await this.likesRepository.deleteLike(noteId, actorUrl);
          responseCallback?.();
        } catch (err) {
          console.error(
            "[HandleC2SLikeActivity] Undo Like failed:",
            (err as Error).message,
          );
          responseCallback?.(
            err instanceof Error ? err : new Error(String(err)),
          );
          throw err;
        }
      }
    }
  }
}
