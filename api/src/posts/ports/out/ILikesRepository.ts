// src/posts/ports/out/ILikesRepository.ts

export interface LikeRecord {
  objectId: string;
  createdAt: number;
}

export interface PostLikeRecord {
  actor: string;
  createdAt: number;
}

export interface ILikesRepository {
  getLikes(
    noteId: string,
    page: number,
    limit: number,
  ): Promise<PostLikeRecord[]>;
  countLikes(noteId: string): Promise<number>;
  getLikedByActor(actor: string): Promise<LikeRecord[]>;
  createLike(noteId: string, actor: string): Promise<void>;
  deleteLike(noteId: string, actor: string): Promise<void>;
  /** Delete all likes by actor. Used for user cascade delete. */
  deleteByActor(actor: string, trx?: unknown): Promise<number>;
  /** Delete all likes on notes belonging to actor (note_id like actorUrl/statuses/%). */
  deleteLikesOnActorPosts(actorUrl: string, trx?: unknown): Promise<number>;
}

