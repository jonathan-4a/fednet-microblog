// src/auth/adapters/db/models/InviteTokenSchema.ts

import type { Kysely } from "kysely";

export interface InviteTokensTable {
  token: string;
  created_by: string | null;
  status: "unused" | "used" | "revoked";
  created_at: number;
  used_at: number | null;
  used_by: string | null;
}

export async function createInviteTokensSchema<
  T extends { invite_tokens: InviteTokensTable },
>(db: Kysely<T>): Promise<void> {
  await db.schema
    .createTable("invite_tokens")
    .ifNotExists()
    .addColumn("token", "text", (col) => col.primaryKey().notNull())
    .addColumn("created_by", "text")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("unused"))
    .addColumn("created_at", "integer", (col) => col.notNull())
    .addColumn("used_at", "integer")
    .addColumn("used_by", "text")
    .execute();
}
