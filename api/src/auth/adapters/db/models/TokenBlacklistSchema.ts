// src/auth/adapters/db/models/TokenBlacklistSchema.ts

import type { Kysely } from "kysely";

export interface TokenBlacklistTable {
  token: string;
  expires_at: number;
  created_at: number;
}

export async function createTokenBlacklistSchema<
  T extends { token_blacklist: TokenBlacklistTable },
>(db: Kysely<T>): Promise<void> {
  await db.schema
    .createTable("token_blacklist")
    .ifNotExists()
    .addColumn("token", "text", (col) => col.primaryKey().notNull())
    .addColumn("expires_at", "integer", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) => col.notNull())
    .execute();
}
