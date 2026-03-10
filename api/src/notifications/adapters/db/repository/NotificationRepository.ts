// src/notifications/adapters/db/repository/NotificationRepository.ts

import type { Kysely } from "kysely";
import type { NotificationsTable } from "../models/NotificationSchema";
import type {
  INotificationRepository,
  NotificationRecord,
} from "../../../ports/out/INotificationRepository";

export class NotificationRepository<
  DB extends { notifications: NotificationsTable } = {
    notifications: NotificationsTable;
  },
> implements INotificationRepository {
  private readonly db: Kysely<{ notifications: NotificationsTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ notifications: NotificationsTable }>;
  }

  async create(record: {
    recipientActor: string;
    actor: string;
    type: "follow" | "like" | "reply" | "repost";
    objectId?: string | null;
  }): Promise<NotificationRecord> {
    const createdAt = Math.floor(Date.now() / 1000);
    await this.db
      .insertInto("notifications")
      .values({
        recipient_actor: record.recipientActor,
        actor: record.actor,
        type: record.type,
        object_id: record.objectId ?? null,
        read_at: null,
        created_at: createdAt,
      })
      .execute();

    const row = await this.db
      .selectFrom("notifications")
      .selectAll()
      .where("recipient_actor", "=", record.recipientActor)
      .where("actor", "=", record.actor)
      .where("created_at", "=", createdAt)
      .orderBy("id", "desc")
      .limit(1)
      .executeTakeFirstOrThrow();

    return this.toRecord(row);
  }

  async listByRecipient(
    recipientActor: string,
    limit: number,
    offset: number,
  ): Promise<NotificationRecord[]> {
    const rows = await this.db
      .selectFrom("notifications")
      .selectAll()
      .where("recipient_actor", "=", recipientActor)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => this.toRecord(row));
  }

  async countUnreadByRecipient(recipientActor: string): Promise<number> {
    const result = await this.db
      .selectFrom("notifications")
      .select(this.db.fn.count("id").as("count"))
      .where("recipient_actor", "=", recipientActor)
      .where("read_at", "is", null)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async markAsRead(id: number, recipientActor: string): Promise<boolean> {
    const readAt = Math.floor(Date.now() / 1000);
    const result = await this.db
      .updateTable("notifications")
      .set({ read_at: readAt })
      .where("id", "=", id)
      .where("recipient_actor", "=", recipientActor)
      .executeTakeFirst();

    return Number(result?.numUpdatedRows ?? 0) > 0;
  }

  async markAllAsRead(recipientActor: string): Promise<number> {
    const readAt = Math.floor(Date.now() / 1000);
    const result = await this.db
      .updateTable("notifications")
      .set({ read_at: readAt })
      .where("recipient_actor", "=", recipientActor)
      .where("read_at", "is", null)
      .executeTakeFirst();

    return Number(result?.numUpdatedRows ?? 0);
  }

  private toRecord(row: {
    id: number;
    recipient_actor: string;
    actor: string;
    type: string;
    object_id: string | null;
    read_at: number | null;
    created_at: number;
  }): NotificationRecord {
    return {
      id: row.id,
      recipientActor: row.recipient_actor,
      actor: row.actor,
      type: row.type as "follow" | "like" | "reply" | "repost",
      objectId: row.object_id,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  }
}
