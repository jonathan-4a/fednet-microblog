// src/posts/usecases/GetPostByNoteId.ts

import type { IPostRepository, PostRecord } from "../ports/out/IPostRepository";
import type { IGetPostByNoteId } from "../ports/in/IGetPostByNoteId";

export class GetPostByNoteId implements IGetPostByNoteId {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly ourOrigin: string,
  ) {}

  async execute(noteId: string): Promise<PostRecord | null> {
    let post = await this.postRepository.findByNoteId(noteId);
    if (!post && noteId.startsWith(this.ourOrigin)) {
      const match = noteId.match(/\/u\/([^/]+)\/statuses\/([^#?]+)/);
      if (match) {
        const [, username, guid] = match;
        post = await this.postRepository.findByGuidAndAuthor(guid, username);
      }
    }
    return post;
  }
}
