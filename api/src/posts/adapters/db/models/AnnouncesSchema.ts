// src/posts/adapters/db/models/AnnouncesSchema.ts

import type { Kysely } from "kysely";

export interface AnnouncesTable {
  note_id: string;
  actor: string;
  created_at: number;
}

export async function createAnnouncesSchema<
  T extends { announces: AnnouncesTable },
>(db: Kysely<T>): Promise<void> {
  await db.schema
    .createTable("announces")
    .ifNotExists()
    .addColumn("note_id", "text", (col) => col.notNull())
    .addColumn("actor", "text", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("announces_pk", ["note_id", "actor"])
    .execute();
}

