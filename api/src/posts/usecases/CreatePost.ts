// src/posts/usecases/CreatePost.ts

import type { IUserRepository } from "@users";
import type { IIdGenerator, IEventBus } from "@shared";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { ICreatePost } from "../ports/in/ICreatePost";
import type { CreatePostInput, CreatePostOutput } from "../ports/in/Posts.dto";
import type { INoteSerializer, IActivitySerializer } from "@apcore";
import { PostCreatedEvent } from "../domain/events";
import { PostValidationError } from "../domain/PostsErrors";

export class CreatePost implements ICreatePost {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventBus: IEventBus,
    private readonly noteSerializer: INoteSerializer,
    private readonly activitySerializer: IActivitySerializer,
  ) {}

  async execute(input: CreatePostInput): Promise<CreatePostOutput> {
    const {
      username,
      content,
      inReplyTo,
      host,
      protocol,
      actor,
      noteId,
      guid,
    } = input;
    const trimmedContent = content?.trim() ?? "";
    if (!trimmedContent) {
      throw new PostValidationError("Content is required");
    }

    let finalGuid = guid;
    if (!finalGuid && noteId) {
      const m = noteId.match(/\/statuses\/([^/?#]+)$/);
      if (m) finalGuid = decodeURIComponent(m[1]);
    }
    if (!finalGuid) finalGuid = this.idGenerator.generate();
    const createdAt = Math.floor(Date.now() / 1000);
    const finalNoteId =
      noteId || `${protocol}://${host}/u/${username}/statuses/${finalGuid}`;

    const authorUsername = actor && actor.includes("://") ? actor : username;

    await this.postRepository.create({
      guid: finalGuid,
      authorUsername,
      content: trimmedContent,
      inReplyTo: inReplyTo ?? null,
      noteId: noteId || finalNoteId,
      createdAt,
    });

    const actorUrl = actor || `${protocol}://${host}/u/${username}`;
    const publishedIso = new Date(createdAt * 1000).toISOString();
    const note = this.noteSerializer.create(
      finalNoteId,
      actorUrl,
      trimmedContent,
      publishedIso,
      inReplyTo ?? null,
      host,
      protocol,
    );

    const createActivity = this.activitySerializer.createCreate(
      actorUrl,
      note,
      `${finalNoteId}#create`,
      publishedIso,
    );

    const postCreatedEvent = new PostCreatedEvent({
      guid: finalGuid,
      username,
      actorUrl,
      createActivity,
    });
    this.eventBus.emit(postCreatedEvent);

    return {
      guid: finalGuid,
      createdAt,
      note,
      createActivity,
    };
  }
}
