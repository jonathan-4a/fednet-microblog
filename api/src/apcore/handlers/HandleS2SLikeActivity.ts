// src/apcore/handlers/HandleS2SLikeActivity.ts

import type { ILikesRepository } from "@posts";
import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

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

export class HandleS2SLikeActivity {
  constructor(
    private readonly likesRepository: ILikesRepository,
    private readonly resolveNoteAuthorActor: IResolveNoteAuthorActor,
    private readonly notify: INotificationActivityEmitter | null,
  ) {}

  async handle(event: ActivityReceivedEvent): Promise<void> {
    const { activity } = event.payload;

    const activityType =
      typeof activity.type === "string"
        ? activity.type
        : String(activity?.type);
    const actorUrl =
      typeof activity.actor === "string" ? activity.actor : undefined;

    if (activityType === "Like" && actorUrl) {
      const noteId = getNoteId(activity.object);
      if (!noteId) return;

      try {
        await this.likesRepository.createLike(noteId, actorUrl);
        const recipientActor =
          await this.resolveNoteAuthorActor.resolve(noteId);
        if (this.notify && recipientActor && recipientActor !== actorUrl) {
          await this.notify.onLikeDone(recipientActor, actorUrl, noteId);
        }
      } catch (err) {
        console.error(
          "[HandleS2SLikeActivity] Like or notification failed:",
          (err as Error).message,
        );
      }
      return;
    }

    if (activityType === "Undo" && actorUrl) {
      const obj = activity.object as Record<string, unknown> | undefined;
      if (obj?.type === "Like") {
        const noteId = getNoteId(obj.object);
        if (!noteId) return;

        try {
          await this.likesRepository.deleteLike(noteId, actorUrl);
        } catch (err) {
          console.error(
            "[HandleS2SLikeActivity] Undo Like failed:",
            (err as Error).message,
          );
        }
      }
    }
  }
}
