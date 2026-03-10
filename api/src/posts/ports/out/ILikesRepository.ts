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
  deleteByActor(actor: string, trx?: unknown): Promise<number>;
  deleteLikesOnActorPosts(actorUrl: string, trx?: unknown): Promise<number>;
}
