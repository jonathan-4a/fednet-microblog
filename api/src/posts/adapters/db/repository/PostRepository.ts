import type { Kysely, ExpressionBuilder } from "kysely";
import type { PostsTable } from "../models/PostSchema";
import type {
  IPostRepository,
  PostRecord,
} from "../../../ports/out/IPostRepository";
import { extractUsernameFromActorUrl } from "../../../utils/author";
import { normalizeNoteIdUrl } from "../../../utils/noteId";

type DB = { posts: PostsTable };

const COLUMNS = [
  "guid",
  "author_username as authorUsername",
  "content",
  "in_reply_to as inReplyTo",
  "note_id as noteId",
  "created_at as createdAt",
  "updated_at as updatedAt",
] as const;

export class PostRepository<TDB extends DB = DB> implements IPostRepository {
  private readonly db: Kysely<DB>;

  constructor(db: Kysely<TDB>) {
    this.db = db as unknown as Kysely<DB>;
  }

  private mapRow(row: {
    guid: string;
    authorUsername: string;
    content: string;
    inReplyTo: string | null;
    noteId?: string | null;
    createdAt: number;
    updatedAt?: number | null;
  }): PostRecord {
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

  private inReplyToWhere(
    eb: ExpressionBuilder<DB, "posts">,
    inReplyTo: string,
  ) {
    const normalized = normalizeNoteIdUrl(inReplyTo);
    const conditions = [
      eb("in_reply_to", "=", normalized),
      eb("in_reply_to", "=", inReplyTo),
    ];

    if (normalized.startsWith("http://") && !normalized.includes(":80")) {
      const match = normalized.match(/^http:\/\/([^\/]+)(\/.*)$/);
      if (match) {
        conditions.push(
          eb("in_reply_to", "=", `http://${match[1]}:80${match[2]}`),
        );
      }
    }

    if (normalized.includes(":80/")) {
      conditions.push(eb("in_reply_to", "=", normalized.replace(":80/", "/")));
    }

    return eb.or(conditions);
  }

  private authorWhere(
    eb: ExpressionBuilder<DB, "posts">,
    authorUsername: string,
  ) {
    return eb.or([
      eb("author_username", "=", authorUsername),
      ...(extractUsernameFromActorUrl(authorUsername)
        ? []
        : [eb("author_username", "like", `%/u/${authorUsername}%`)]),
    ]);
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
      .select(COLUMNS)
      .where("guid", "=", guid)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async findByNoteId(noteId: string): Promise<PostRecord | null> {
    const row = await this.db
      .selectFrom("posts")
      .select(COLUMNS)
      .where("note_id", "=", noteId)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async findByGuidAndAuthor(
    guid: string,
    authorUsername: string,
  ): Promise<PostRecord | null> {
    const row = await this.db
      .selectFrom("posts")
      .select(COLUMNS)
      .where("guid", "=", guid)
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async findByAuthor(
    authorUsername: string,
    limit = 20,
    offset = 0,
  ): Promise<PostRecord[]> {
    const rows = await this.db
      .selectFrom("posts")
      .select(COLUMNS)
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .where("in_reply_to", "is", null)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((r) => this.mapRow(r));
  }

  async findByAuthorIncludingReplies(
    authorUsername: string,
    limit = 20,
    offset = 0,
  ): Promise<PostRecord[]> {
    const rows = await this.db
      .selectFrom("posts")
      .select(COLUMNS)
      .where("author_username", "=", authorUsername)
      .where("is_deleted", "=", 0)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((r) => this.mapRow(r));
  }

  async findByInReplyTo(
    inReplyTo: string,
    limit = 20,
    offset = 0,
  ): Promise<PostRecord[]> {
    const rows = await this.db
      .selectFrom("posts")
      .select(COLUMNS)
      .where((eb) => this.inReplyToWhere(eb, inReplyTo))
      .where("is_deleted", "=", 0)
      .orderBy("created_at", "asc")
      .limit(limit)
      .offset(offset)
      .execute();

    return rows.map((r) => this.mapRow(r));
  }

  async countByInReplyTo(inReplyTo: string): Promise<number> {
    const result = await this.db
      .selectFrom("posts")
      .select(({ fn }) => [fn.count("guid").as("count")])
      .where((eb) => this.inReplyToWhere(eb, inReplyTo))
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
    const result = await this.db
      .updateTable("posts")
      .set({
        updated_at: Math.floor(Date.now() / 1000),
        ...(updates.content !== undefined ? { content: updates.content } : {}),
      })
      .where("guid", "=", guid)
      .where("is_deleted", "=", 0)
      .where((eb) => this.authorWhere(eb, authorUsername))
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  }

  async deleteByGuid(guid: string, authorUsername: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.db
      .updateTable("posts")
      .set({ is_deleted: 1, deleted_at: now, updated_at: now })
      .where("guid", "=", guid)
      .where("is_deleted", "=", 0)
      .where((eb) => this.authorWhere(eb, authorUsername))
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  }

  async deleteByAuthor(
    username: string,
    actorUrl: string,
    trx?: unknown,
  ): Promise<number> {
    const db = (trx ?? this.db) as Kysely<DB>;
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
