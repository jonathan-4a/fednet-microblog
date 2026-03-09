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
  getAnnouncedByActorPaginated(
    actor: string,
    limit: number,
    offset: number,
  ): Promise<AnnouncedRecord[]>;
  countByActor(actor: string): Promise<number>;
  create(noteId: string, actor: string, createdAt?: number): Promise<void>;
  deleteByActor(actor: string, trx?: unknown): Promise<number>;
  deleteAnnouncesOnActorPosts(actorUrl: string, trx?: unknown): Promise<number>;
}
