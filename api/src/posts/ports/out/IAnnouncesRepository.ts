// src/posts/ports/out/IAnnouncesRepository.ts

export interface AnnounceRecord {
  actor: string;
  createdAt: number;
}

export interface AnnouncedRecord {
  objectId: string;
  createdAt: number;
}

export interface IAnnouncesRepository {
  getAnnounces(
    noteId: string,
    page: number,
    limit: number,
  ): Promise<AnnounceRecord[]>;
  countAnnounces(noteId: string): Promise<number>;
  getAnnouncedByActor(actor: string): Promise<AnnouncedRecord[]>;
  /** Paginated reposts by actor for outbox merge. */
  getAnnouncedByActorPaginated(
    actor: string,
    limit: number,
    offset: number,
  ): Promise<AnnouncedRecord[]>;
  /** Total repost count by actor (for outbox totalItems). */
  countByActor(actor: string): Promise<number>;
  /** Store a repost (idempotent by note_id+actor). */
  create(
    noteId: string,
    actor: string,
    createdAt?: number,
  ): Promise<void>;
  /** Delete all announces by actor. Used for user cascade delete. */
  deleteByActor(actor: string, trx?: unknown): Promise<number>;
  /** Delete announces of actor's posts (note_id like actorUrl/statuses/%). */
  deleteAnnouncesOnActorPosts(actorUrl: string, trx?: unknown): Promise<number>;
}

