// src/apcore/handlers/HandleS2SCreateActivity.ts

import type { IPostRepository } from "@posts";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

/**
 * Handles incoming Create activities from remote servers (S2S).
 * Stores replies to our local posts so they appear in /statuses/:id/replies.
 * Matches how remote servers (e.g. Mastodon) behave.
 */
export class HandleS2SCreateActivity {
  constructor(private readonly postRepository: IPostRepository) {}

  async handle(event: ActivityReceivedEvent): Promise<void> {
    const { activity, host, protocol } = event.payload;

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

    const inReplyTo =
      typeof note.inReplyTo === "string" && note.inReplyTo
        ? note.inReplyTo
        : null;
    if (!inReplyTo) {
      return; // Only store replies, not top-level posts
    }

    // Only store replies to our own server's content
    const ourOrigin = `${protocol}://${host}`;
    if (!inReplyTo.startsWith(ourOrigin)) {
      return;
    }

    const noteId = typeof note.id === "string" ? note.id : null;
    if (!noteId) {
      return;
    }

    // Idempotent: skip if we already have this note
    const existing = await this.postRepository.findByNoteId(noteId);
    if (existing) {
      return;
    }

    const content =
      typeof note.content === "string" ? note.content : String(note?.content ?? "");
    const trimmedContent = content.trim();
    if (!trimmedContent) {
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

    // Use full noteId as guid for remote posts to avoid collisions (remote servers may use numeric IDs)
    const guid = noteId;

    const published =
      typeof note.published === "string" ? note.published : new Date().toISOString();
    const createdAt = Math.floor(new Date(published).getTime() / 1000);

    await this.postRepository.create({
      guid,
      authorUsername: actorUrl,
      content: trimmedContent,
      inReplyTo,
      noteId,
      createdAt,
    });

    console.log(
      `[HandleS2SCreateActivity] Stored inbound reply ${noteId} to ${inReplyTo}`,
    );
  }
}

