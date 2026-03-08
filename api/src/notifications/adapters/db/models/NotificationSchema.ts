// src/notifications/adapters/db/models/NotificationSchema.ts

import type { Kysely, Generated } from "kysely";

export interface NotificationsTable {
  id: Generated<number>;
  recipient_actor: string;
  actor: string;
  type: "follow" | "like" | "reply" | "repost";
  object_id: string | null;
  read_at: number | null;
  created_at: number;
}

export async function createNotificationSchema<
  T extends { notifications: NotificationsTable },
>(db: Kysely<T>): Promise<void> {
  await db.schema
    .createTable("notifications")
    .ifNotExists()
    .addColumn("id", "integer", (col) =>
      col.primaryKey().autoIncrement().notNull(),
    )
    .addColumn("recipient_actor", "text", (col) => col.notNull())
    .addColumn("actor", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("object_id", "text", (col) => col.defaultTo(null))
    .addColumn("read_at", "integer", (col) => col.defaultTo(null))
    .addColumn("created_at", "integer", (col) => col.notNull())
    .execute();
}
