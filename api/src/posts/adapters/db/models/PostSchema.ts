// src/posts/adapters/db/models/PostSchema.ts

import type { Kysely } from "kysely";

export interface PostsTable {
  guid: string;
  author_username: string;
  content: string;
  in_reply_to: string | null;
  note_id: string | null; // Full ActivityPub URL for remote posts
  is_deleted: number;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
}

export async function createPostSchema<T extends { posts: PostsTable }>(
  db: Kysely<T>,
): Promise<void> {
  await db.schema
    .createTable("posts")
    .ifNotExists()
    .addColumn("guid", "text", (col) => col.primaryKey())
    .addColumn("author_username", "text", (col) => col.notNull())
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("in_reply_to", "text")
    .addColumn("note_id", "text") // Full ActivityPub URL for remote posts
    .addColumn("is_deleted", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "integer", (col) => col.notNull())
    .addColumn("updated_at", "integer")
    .addColumn("deleted_at", "integer")
    // Note: Foreign key constraint removed to allow remote authors
    // For local posts, author_username references users.username
    // For remote posts, author_username can be any string (remote username or actor URL)
    .execute();
}

