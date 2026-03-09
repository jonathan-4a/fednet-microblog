// src/apcore/usecases/ResolveNoteAuthorActor.ts

import type { IResolveNoteAuthorActor } from "../ports/out/IResolveNoteAuthorActor";
import type { IGetPostByNoteId } from "@posts";

export class ResolveNoteAuthorActor implements IResolveNoteAuthorActor {
  constructor(
    private readonly getPostByNoteId: IGetPostByNoteId,
    private readonly ourOrigin: string,
  ) {}

  async resolve(noteId: string): Promise<string | null> {
    const post = await this.getPostByNoteId.execute(noteId);
    if (!post) return null;
    return post.authorUsername.includes("://")
      ? post.authorUsername
      : `${this.ourOrigin}/u/${post.authorUsername}`;
  }
}
