// src/posts/adapters/db/models/LikesSchema.ts

import type { Kysely } from "kysely";

export interface LikesTable {
  note_id: string;
  actor: string;
  created_at: number;
}

export async function createLikesSchema<T extends { likes: LikesTable }>(
  db: Kysely<T>,
): Promise<void> {
  await db.schema
    .createTable("likes")
    .ifNotExists()
    .addColumn("note_id", "text", (col) => col.notNull())
    .addColumn("actor", "text", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("likes_pk", ["note_id", "actor"])
    .execute();
}
