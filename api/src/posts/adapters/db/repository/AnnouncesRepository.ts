// src/posts/adapters/db/repository/AnnouncesRepository.ts

import type { Kysely } from "kysely";
import type { AnnouncesTable } from "../models/AnnouncesSchema";
import type {
  IAnnouncesRepository,
  AnnounceRecord,
  AnnouncedRecord,
} from "../../../ports/out/IAnnouncesRepository";

export class AnnouncesRepository<
  DB extends { announces: AnnouncesTable } = { announces: AnnouncesTable },
> implements IAnnouncesRepository {
  private readonly db: Kysely<{ announces: AnnouncesTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ announces: AnnouncesTable }>;
  }

  async getAnnounces(
    noteId: string,
    page: number,
    limit: number,
  ): Promise<AnnounceRecord[]> {
    const offset = (page - 1) * limit;
    const rows = await this.db
      .selectFrom("announces")
      .select(["actor", "created_at as createdAt"])
      .where("note_id", "=", noteId)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => ({
      actor: row.actor,
      createdAt: row.createdAt,
    }));
  }

  async countAnnounces(noteId: string): Promise<number> {
    const result = await this.db
      .selectFrom("announces")
      .select(({ fn }) => fn.count("note_id").as("count"))
      .where("note_id", "=", noteId)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async getAnnouncedByActor(actor: string): Promise<AnnouncedRecord[]> {
    const rows = await this.db
      .selectFrom("announces")
      .select(["note_id as objectId", "created_at as createdAt"])
      .where("actor", "=", actor)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map((row) => ({
      objectId: row.objectId,
      createdAt: row.createdAt,
    }));
  }

  async getAnnouncedByActorPaginated(
    actor: string,
    limit: number,
    offset: number,
  ): Promise<AnnouncedRecord[]> {
    const rows = await this.db
      .selectFrom("announces")
      .select(["note_id as objectId", "created_at as createdAt"])
      .where("actor", "=", actor)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => ({
      objectId: row.objectId,
      createdAt: row.createdAt,
    }));
  }

  async countByActor(actor: string): Promise<number> {
    const result = await this.db
      .selectFrom("announces")
      .select(({ fn }) => fn.count("actor").as("count"))
      .where("actor", "=", actor)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async create(
    noteId: string,
    actor: string,
    createdAt?: number,
  ): Promise<void> {
    const ts = createdAt ?? Math.floor(Date.now() / 1000);
    await this.db
      .insertInto("announces")
      .values({
        note_id: noteId,
        actor,
        created_at: ts,
      })
      .onConflict((oc) => oc.columns(["note_id", "actor"]).doNothing())
      .execute();
  }

  async deleteByActor(actor: string, trx?: unknown): Promise<number> {
    const db = (trx ?? this.db) as Kysely<{ announces: AnnouncesTable }>;
    const result = await db
      .deleteFrom("announces")
      .where("actor", "=", actor)
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }

  async deleteAnnouncesOnActorPosts(
    actorUrl: string,
    trx?: unknown,
  ): Promise<number> {
    const db = (trx ?? this.db) as Kysely<{ announces: AnnouncesTable }>;
    const pattern = `${actorUrl}/statuses/%`;
    const result = await db
      .deleteFrom("announces")
      .where("note_id", "like", pattern)
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }
}

