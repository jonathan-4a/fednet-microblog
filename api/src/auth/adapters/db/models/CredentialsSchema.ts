// src/auth/adapters/db/models/CredentialsSchema.ts

import type { Kysely } from "kysely";

export interface CredentialsTable {
  username: string;
  password_hash: string;
  public_key_pem: string;
  privkey: string;
}

export async function createCredentialsSchema<
  T extends { credentials: CredentialsTable },
>(db: Kysely<T>): Promise<void> {
  await db.schema
    .createTable("credentials")
    .ifNotExists()
    .addColumn("username", "text", (col) => col.primaryKey().notNull())
    .addColumn("password_hash", "text", (col) => col.notNull())
    .addColumn("public_key_pem", "text", (col) => col.notNull())
    .addColumn("privkey", "text", (col) => col.notNull())
    .addForeignKeyConstraint(
      "credentials_user_fk",
      ["username"],
      "users",
      ["username"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute();
}
