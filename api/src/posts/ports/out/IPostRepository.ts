// src/posts/ports/out/IPostRepository.ts

export interface PostRecord {
  guid: string;
  authorUsername: string;
  content: string;
  inReplyTo: string | null;
  noteId: string | null;
  createdAt: number;
  updatedAt: number | null;
}

export interface IPostRepository {
  findByGuid(guid: string): Promise<PostRecord | null>;
  findByNoteId(noteId: string): Promise<PostRecord | null>;
  findByGuidAndAuthor(
    guid: string,
    authorUsername: string,
  ): Promise<PostRecord | null>;
  findByAuthor(
    authorUsername: string,
    limit?: number,
    offset?: number,
  ): Promise<PostRecord[]>;
  findByAuthorIncludingReplies(
    authorUsername: string,
    limit?: number,
    offset?: number,
  ): Promise<PostRecord[]>;
  findByInReplyTo(
    inReplyTo: string,
    limit?: number,
    offset?: number,
  ): Promise<PostRecord[]>;
  countByInReplyTo(inReplyTo: string): Promise<number>;
  countByAuthor(authorUsername: string): Promise<number>;
  countByAuthorIncludingReplies(authorUsername: string): Promise<number>;
  create(post: {
    guid: string;
    authorUsername: string;
    content: string;
    inReplyTo: string | null;
    noteId?: string | null;
    createdAt: number;
  }): Promise<void>;
  updateByGuid(
    guid: string,
    authorUsername: string,
    updates: { content?: string },
  ): Promise<number>;
  deleteByGuid(guid: string, authorUsername: string): Promise<number>;

  deleteByAuthor(
    username: string,
    actorUrl: string,
    trx?: unknown,
  ): Promise<number>;
}
