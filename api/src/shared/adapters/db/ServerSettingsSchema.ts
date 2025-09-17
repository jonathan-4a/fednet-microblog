// src/shared/adapters/db/models/ServerSettingsSchema.ts

import type { Kysely } from "kysely";

export interface ServerSettingsTable {
  id: string;
  registration_mode: string;
  allow_public_peers: number;
  auto_fetch_peer_links: number;
  updated_at: number;
}

export async function createServerSettingsSchema<
  T extends { server_settings: ServerSettingsTable },
>(db: Kysely<T>): Promise<void> {
  await db.schema
    .createTable("server_settings")
    .ifNotExists()
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("registration_mode", "text", (col) =>
      col.notNull().defaultTo("open"),
    )
    .addColumn("allow_public_peers", "integer", (col) =>
      col.notNull().defaultTo(1),
    )
    .addColumn("auto_fetch_peer_links", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn("updated_at", "integer", (col) => col.notNull())
    .execute();
}

