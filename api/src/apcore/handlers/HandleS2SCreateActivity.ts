// src/apcore/handlers/HandleS2SCreateActivity.ts

import type { IPostRepository } from "@posts";
import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

export class HandleS2SCreateActivity {
  constructor(
    private readonly postRepository: IPostRepository,
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

    const inReplyTo =
      typeof note.inReplyTo === "string" && note.inReplyTo
        ? note.inReplyTo
        : null;
    if (!inReplyTo) {
      return;
    }

    const noteId = typeof note.id === "string" ? note.id : null;
    if (!noteId) {
      return;
    }

    const existing = await this.postRepository.findByNoteId(noteId);
    if (existing) {
      return;
    }

    const content =
      typeof note.content === "string"
        ? note.content
        : typeof note.content === "object"
          ? JSON.stringify(note.content)
          : null;
    if (!content) {
      return;
    }

    const actorUrl =
      typeof note.attributedTo === "string"
        ? note.attributedTo
        : typeof activity.actor === "string"
          ? activity.actor
          : null;
    if (!actorUrl) {
      return;
    }

    const guid = noteId;

    const published =
      typeof note.published === "string"
        ? note.published
        : new Date().toISOString();
    const createdAt = Math.floor(new Date(published).getTime() / 1000);

    await this.postRepository.create({
      guid,
      authorUsername: actorUrl,
      content,
      inReplyTo,
      noteId,
      createdAt,
    });

    const isRemoteReply = !actorUrl.startsWith(this.ourOrigin);
    if (isRemoteReply && this.resolveNoteAuthorActor && this.notify) {
      const recipientActor =
        await this.resolveNoteAuthorActor.resolve(inReplyTo);
      if (recipientActor && recipientActor !== actorUrl) {
        await this.notify.onReplyDone(recipientActor, actorUrl, noteId);
      }
    }

    console.log(
      `[HandleS2SCreateActivity] Stored inbound reply ${noteId} to ${inReplyTo}`,
    );
  }
}
