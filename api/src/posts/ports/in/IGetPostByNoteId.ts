// src/posts/ports/in/IGetPostByNoteId.ts

import type { PostRecord } from "../out/IPostRepository";

export interface IGetPostByNoteId {
  execute(noteId: string): Promise<PostRecord | null>;
}
