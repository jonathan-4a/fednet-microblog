// src/posts/adapters/db/repository/LikesRepository.ts

import type { Kysely } from "kysely";
import type { LikesTable } from "../models/LikesSchema";
import type {
  ILikesRepository,
  PostLikeRecord,
  LikeRecord,
} from "../../../ports/out/ILikesRepository";

export class LikesRepository<
  DB extends { likes: LikesTable } = { likes: LikesTable },
> implements ILikesRepository {
  private readonly db: Kysely<{ likes: LikesTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ likes: LikesTable }>;
  }

  private normalizeNoteId(noteId: string): string {
    let normalized = noteId;
    if (normalized.includes("#") && normalized.includes("/u/")) {
      const match = normalized.match(/^(https?:\/\/[^\/]+)\/u\/([^#]+)#(.+)$/);
      if (match) {
        const [, baseUrl, username, guid] = match;
        normalized = `${baseUrl}/u/${username}/statuses/${guid}`;
      }
    }
    return normalized;
  }

  async getLikes(
    noteId: string,
    page: number,
    limit: number,
  ): Promise<PostLikeRecord[]> {
    const normalizedNoteId = this.normalizeNoteId(noteId);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .selectFrom("likes")
      .select(["actor", "created_at as createdAt"])
      .where((eb) =>
        eb.or([
          eb("note_id", "=", normalizedNoteId),
          eb("note_id", "=", noteId),
        ]),
      )
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => ({
      actor: row.actor,
      createdAt: row.createdAt,
    }));
  }

  async countLikes(noteId: string): Promise<number> {
    const normalizedNoteId = this.normalizeNoteId(noteId);
    const result = await this.db
      .selectFrom("likes")
      .select(({ fn }) => fn.count("note_id").as("count"))
      .where((eb) =>
        eb.or([
          eb("note_id", "=", normalizedNoteId),
          eb("note_id", "=", noteId),
        ]),
      )
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async getLikedByActor(actor: string): Promise<LikeRecord[]> {
    const rows = await this.db
      .selectFrom("likes")
      .select(["note_id as objectId", "created_at as createdAt"])
      .where("actor", "=", actor)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map((row) => ({
      objectId: row.objectId,
      createdAt: row.createdAt,
    }));
  }

  async createLike(noteId: string, actor: string): Promise<void> {
    const createdAt = Math.floor(Date.now() / 1000);
    await this.db
      .insertInto("likes")
      .values({
        note_id: noteId,
        actor,
        created_at: createdAt,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  async deleteLike(noteId: string, actor: string): Promise<void> {
    const normalizedNoteId = this.normalizeNoteId(noteId);
    await this.db
      .deleteFrom("likes")
      .where((eb) =>
        eb.or([
          eb("note_id", "=", normalizedNoteId),
          eb("note_id", "=", noteId),
        ]),
      )
      .where("actor", "=", actor)
      .execute();
  }

  async deleteByActor(actor: string, trx?: unknown): Promise<number> {
    const db = (trx ?? this.db) as Kysely<{ likes: LikesTable }>;
    const result = await db
      .deleteFrom("likes")
      .where("actor", "=", actor)
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }

  async deleteLikesOnActorPosts(actorUrl: string, trx?: unknown): Promise<number> {
    const db = (trx ?? this.db) as Kysely<{ likes: LikesTable }>;
    const pattern = `${actorUrl}/statuses/%`;
    const result = await db
      .deleteFrom("likes")
      .where("note_id", "like", pattern)
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }
}

