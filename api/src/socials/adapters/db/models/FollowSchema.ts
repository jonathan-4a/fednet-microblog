// src/socials/adapters/db/models/FollowSchema.ts

import type { Kysely } from "kysely";

export interface FollowsTable {
  follower_actor: string;
  followed_actor: string;
  status: "pending" | "accepted";
  created_at: number;
}

export async function createFollowSchema<T extends { follows: FollowsTable }>(
  db: Kysely<T>,
): Promise<void> {
  // Drop table if it exists (to handle schema migration from username to actor)
  await db.schema.dropTable("follows").ifExists().execute();

  await db.schema
    .createTable("follows")
    .addColumn("follower_actor", "text", (col) => col.notNull())
    .addColumn("followed_actor", "text", (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull().defaultTo("pending"))
    .addColumn("created_at", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("follows_pk", ["follower_actor", "followed_actor"])
    .execute();
}

