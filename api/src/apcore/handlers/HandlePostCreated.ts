// src/apcore/handlers/HandlePostCreated.ts

import type { IFanOutActivity } from "../ports/in/IFanOutActivity";
import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";

export interface PostCreatedEventPayload {
  actorUrl: string;
  createActivity: Record<string, unknown>;
}

export class HandlePostCreated {
  constructor(
    private readonly fanOutActivity: IFanOutActivity,
    private readonly resolveNoteAuthorActor: IResolveNoteAuthorActor | null,
    private readonly notify: INotificationActivityEmitter | null,
  ) {}

  async handle(event: { payload: PostCreatedEventPayload }): Promise<void> {
    const { actorUrl, createActivity } = event.payload;

    try {
      await this.fanOutActivity.execute({ actorUrl, activity: createActivity });
    } catch (err) {
      console.error(
        "[HandlePostCreated] Fan-out failed:",
        (err as Error).message,
      );
    }

    const inReplyTo =
      createActivity?.object &&
      typeof createActivity.object === "object" &&
      (createActivity.object as Record<string, unknown>)?.inReplyTo;
    if (
      !inReplyTo ||
      typeof inReplyTo !== "string" ||
      !this.resolveNoteAuthorActor ||
      !this.notify
    ) {
      return;
    }

    try {
      const recipientActor =
        await this.resolveNoteAuthorActor.resolve(inReplyTo);
      if (!recipientActor || recipientActor === actorUrl) return;

      const replyNoteId =
        createActivity?.object &&
        typeof createActivity.object === "object" &&
        (createActivity.object as Record<string, unknown>)?.id;
      const objectId = typeof replyNoteId === "string" ? replyNoteId : null;

      await this.notify.onReplyDone(recipientActor, actorUrl, objectId);
    } catch (err) {
      console.error(
        "[HandlePostCreated] Notification (reply) failed:",
        (err as Error).message,
      );
    }
  }
}
