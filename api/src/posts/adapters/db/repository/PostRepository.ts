// src/posts/adapters/db/repository/PostRepository.ts

import type { Kysely } from "kysely";
import type { PostsTable } from "../models/PostSchema";
import type {
  IPostRepository,
  PostRecord,
} from "../../../ports/out/IPostRepository";

export class PostRepository<
  DB extends { posts: PostsTable } = { posts: PostsTable },
> implements IPostRepository {
  private readonly db: Kysely<{ posts: PostsTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ posts: PostsTable }>;
  }

  private normalizeNoteIdUrl(url: string): string {
    let normalized = url;
    if (normalized.includes("#") && normalized.includes("/u/")) {
      const match = normalized.match(/^(https?:\/\/[^\/]+)\/u\/([^#]+)#(.+)$/);
      if (match) {
        const [, baseUrl, username, guid] = match;
        normalized = `${baseUrl}/u/${username}/statuses/${guid}`;
      }
    }
    normalized = normalized.replace(/^http:\/\/([^/:]+):80\//, "http://$1/");
    normalized = normalized.replace(/^https:\/\/([^/:]+):443\//, "https://$1/");
    return normalized;
  }

  async create(post: {
    guid: string;
    authorUsername: string;
    content: string;
    inReplyTo: string | null;
    noteId?: string | null;
    createdAt: number;
  }): Promise<void> {
    await this.db
      .insertInto("posts")
      .values({
        guid: post.guid,
        author_username: post.authorUsername,
        content: post.content,
        in_reply_to: post.inReplyTo,
        note_id: post.noteId ?? null,
        is_deleted: 0,
        created_at: post.createdAt,
        updated_at: null,
        deleted_at: null,
      })
      .execute();
  }

  async findByGuid(guid: string): Promise<PostRecord | null> {
    const row = await this.db
      .selectFrom("posts")
      .select([
        "guid",
        "author_username as authorUsername",
        "content",
        "in_reply_to as inReplyTo",
        "note_id as noteId",
        "created_at as createdAt",
        "updated_at as updatedAt",
      ])
      .where("guid", "=", guid)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      guid: row.guid,
      authorUsername: row.authorUsername,
      content: row.content,
      inReplyTo: row.inReplyTo,
      noteId: row.noteId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    };
  }

  async findByNoteId(noteId: string): Promise<PostRecord | null> {
    const row = await this.db
      .selectFrom("posts")
      .select([
        "guid",
        "author_username as authorUsername",
        "content",
        "in_reply_to as inReplyTo",
        "note_id as noteId",
        "created_at as createdAt",
        "updated_at as updatedAt",
      ])
      .where("note_id", "=", noteId)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      guid: row.guid,
      authorUsername: row.authorUsername,
      content: row.content,
      inReplyTo: row.inReplyTo,
      noteId: row.noteId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    };
  }

  async findByAuthor(
    authorUsername: string,
    limit = 20,
    offset = 0,
  ): Promise<PostRecord[]> {
    const rows = await this.db
      .selectFrom("posts")
      .select([
        "guid",
        "author_username as authorUsername",
        "content",
        "in_reply_to as inReplyTo",
        "note_id as noteId",
        "created_at as createdAt",
        "updated_at as updatedAt",
      ])
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .where("in_reply_to", "is", null)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => ({
      guid: row.guid,
      authorUsername: row.authorUsername,
      content: row.content,
      inReplyTo: row.inReplyTo,
      noteId: row.noteId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    }));
  }

  async findByAuthorIncludingReplies(
    authorUsername: string,
    limit = 20,
    offset = 0,
  ): Promise<PostRecord[]> {
    const rows = await this.db
      .selectFrom("posts")
      .select([
        "guid",
        "author_username as authorUsername",
        "content",
        "in_reply_to as inReplyTo",
        "note_id as noteId",
        "created_at as createdAt",
        "updated_at as updatedAt",
      ])
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => ({
      guid: row.guid,
      authorUsername: row.authorUsername,
      content: row.content,
      inReplyTo: row.inReplyTo,
      noteId: row.noteId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    }));
  }

  async findByInReplyTo(
    inReplyTo: string,
    limit = 20,
    offset = 0,
  ): Promise<PostRecord[]> {
    const normalizedInReplyTo = this.normalizeNoteIdUrl(inReplyTo);
    const rows = await this.db
      .selectFrom("posts")
      .select([
        "guid",
        "author_username as authorUsername",
        "content",
        "in_reply_to as inReplyTo",
        "note_id as noteId",
        "created_at as createdAt",
        "updated_at as updatedAt",
      ])
      .where((eb) => {
        const conditions = [
          eb("in_reply_to", "=", normalizedInReplyTo),
          eb("in_reply_to", "=", inReplyTo),
        ];
        if (
          normalizedInReplyTo.startsWith("http://") &&
          !normalizedInReplyTo.includes(":80")
        ) {
          const match = normalizedInReplyTo.match(/^http:\/\/([^\/]+)(\/.*)$/);
          if (match) {
            const [, host, path] = match;
            const withPort = `http://${host}:80${path}`;
            conditions.push(eb("in_reply_to", "=", withPort));
          }
        }
        if (normalizedInReplyTo.includes(":80/")) {
          const withoutPort = normalizedInReplyTo.replace(":80/", "/");
          conditions.push(eb("in_reply_to", "=", withoutPort));
        }
        return eb.or(conditions);
      })
      .where("is_deleted", "=", 0)
      .orderBy("created_at", "asc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((row) => ({
      guid: row.guid,
      authorUsername: row.authorUsername,
      content: row.content,
      inReplyTo: row.inReplyTo,
      noteId: row.noteId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    }));
  }

  async countByInReplyTo(inReplyTo: string): Promise<number> {
    const normalizedInReplyTo = this.normalizeNoteIdUrl(inReplyTo);
    const result = await this.db
      .selectFrom("posts")
      .select(({ fn }) => [fn.count("guid").as("count")])
      .where((eb) => {
        const conditions = [
          eb("in_reply_to", "=", normalizedInReplyTo),
          eb("in_reply_to", "=", inReplyTo),
        ];
        if (
          normalizedInReplyTo.startsWith("http://") &&
          !normalizedInReplyTo.includes(":80")
        ) {
          const match = normalizedInReplyTo.match(/^http:\/\/([^\/]+)(\/.*)$/);
          if (match) {
            const [, host, path] = match;
            const withPort = `http://${host}:80${path}`;
            conditions.push(eb("in_reply_to", "=", withPort));
          }
        }
        if (normalizedInReplyTo.includes(":80/")) {
          const withoutPort = normalizedInReplyTo.replace(":80/", "/");
          conditions.push(eb("in_reply_to", "=", withoutPort));
        }
        return eb.or(conditions);
      })
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async countByAuthor(authorUsername: string): Promise<number> {
    const result = await this.db
      .selectFrom("posts")
      .select(({ fn }) => [fn.count("guid").as("count")])
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .where("in_reply_to", "is", null)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async countByAuthorIncludingReplies(authorUsername: string): Promise<number> {
    const result = await this.db
      .selectFrom("posts")
      .select(({ fn }) => [fn.count("guid").as("count")])
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async updateByGuid(
    guid: string,
    authorUsername: string,
    updates: { content?: string },
  ): Promise<number> {
    const updateData: {
      updated_at: number;
      content?: string;
    } = {
      updated_at: Math.floor(Date.now() / 1000),
    };

    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }

    const extractUsernameFromUrl = (url: string): string | null => {
      const match = url.match(/\/u\/([^/]+)$/);
      return match ? match[1] : null;
    };

    const result = await this.db
      .updateTable("posts")
      .set(updateData)
      .where("guid", "=", guid)
      .where("is_deleted", "=", 0)
      .where((eb) =>
        eb.or([
          eb("author_username", "=", authorUsername),
          ...(extractUsernameFromUrl(authorUsername)
            ? []
            : [eb("author_username", "like", `%/u/${authorUsername}%`)]),
        ]),
      )
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  }

  async deleteByGuid(guid: string, authorUsername: string): Promise<number> {
    const extractUsernameFromUrl = (url: string): string | null => {
      const match = url.match(/\/u\/([^/]+)$/);
      return match ? match[1] : null;
    };

    const result = await this.db
      .updateTable("posts")
      .set({
        is_deleted: 1,
        deleted_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      })
      .where("guid", "=", guid)
      .where("is_deleted", "=", 0)
      .where((eb) =>
        eb.or([
          eb("author_username", "=", authorUsername),
          ...(extractUsernameFromUrl(authorUsername)
            ? []
            : [eb("author_username", "like", `%/u/${authorUsername}%`)]),
        ]),
      )
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  }

  async deleteByAuthor(
    username: string,
    actorUrl: string,
    trx?: unknown,
  ): Promise<number> {
    const db = (trx ?? this.db) as Kysely<{ posts: PostsTable }>;
    const result = await db
      .deleteFrom("posts")
      .where((eb) =>
        eb.or([
          eb("author_username", "=", username),
          eb("author_username", "=", actorUrl),
        ]),
      )
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }
}


