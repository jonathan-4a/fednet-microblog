// src/users/adapters/db/models/UserSchema.ts

import type { Kysely } from "kysely";

export interface UsersTable {
  username: string;
  display_name: string;
  summary: string;
  is_active: 0 | 1;
  is_admin: 0 | 1;
  is_following_public: 0 | 1;
  created_at: number;
}

export async function createUserSchema<T extends { users: UsersTable }>(
  db: Kysely<T>,
): Promise<void> {
  await db.schema
    .createTable("users")
    .ifNotExists()
    .addColumn("username", "text", (col) => col.primaryKey().notNull())
    .addColumn("display_name", "text")
    .addColumn("summary", "text")
    .addColumn("is_active", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("is_admin", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("is_following_public", "integer", (col) =>
      col.notNull().defaultTo(1),
    )
    .addColumn("created_at", "integer", (col) => col.notNull())
    .execute();
}

