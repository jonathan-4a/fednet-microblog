// src/admin/adapters/db/AdminPostRepository.ts

import type { Kysely } from "kysely";
import type { PostsTable } from "@posts";
import type {
  IAdminPostRepository,
  AdminPostRecord,
  PostsPaginationParams,
  PaginatedPosts,
} from "../../ports/out/IAdminPostRepository";

export class AdminPostRepository<
  DB extends { posts: PostsTable } = { posts: PostsTable },
> implements IAdminPostRepository {
  private readonly db: Kysely<{ posts: PostsTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ posts: PostsTable }>;
  }

  private async safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.warn("Admin post query failed, returning fallback", error);
      return fallback;
    }
  }

  async countAll(): Promise<number> {
    return this.safeQuery(async () => {
      const result = await this.db
        .selectFrom("posts")
        .select((eb) => eb.fn.countAll().as("count"))
        .where("is_deleted", "=", 0)
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    }, 0);
  }

  async countByAuthor(username: string): Promise<number> {
    return this.safeQuery(async () => {
      const result = await this.db
        .selectFrom("posts")
        .select((eb) => eb.fn.countAll().as("count"))
        .where("author_username", "=", username)
        .where("is_deleted", "=", 0)
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    }, 0);
  }

  async findRecentByAuthor(
    username: string,
    limit = 10,
  ): Promise<AdminPostRecord[]> {
    return this.safeQuery(async () => {
      const rows = await this.db
        .selectFrom("posts")
        .select([
          "guid",
          "author_username",
          "content",
          "in_reply_to",
          "is_deleted",
          "created_at",
          "updated_at",
          "deleted_at",
        ])
        .where("author_username", "=", username)
        .where("is_deleted", "=", 0)
        .orderBy("created_at", "desc")
        .limit(limit)
        .execute();

      return rows.map((row) => ({
        guid: row.guid,
        author_username: row.author_username,
        content: row.content,
        in_reply_to: row.in_reply_to ?? null,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at ?? null,
        deleted_at: row.deleted_at ?? null,
      }));
    }, []);
  }

  async paginate(params: PostsPaginationParams): Promise<PaginatedPosts> {
    return this.safeQuery(
      async () => {
        const page = params.page && params.page > 0 ? params.page : 1;
        const limit = params.limit && params.limit > 0 ? params.limit : 20;
        const offset = (page - 1) * limit;

        let baseQuery = this.db
          .selectFrom("posts")
          .selectAll()
          .where("is_deleted", "=", 0)
          .orderBy("created_at", "desc");

        if (params.authorUsername) {
          baseQuery = baseQuery.where(
            "author_username",
            "=",
            params.authorUsername,
          );
        }

        const [postRows, totalResult] = await Promise.all([
          baseQuery
            .select([
              "guid",
              "author_username",
              "content",
              "in_reply_to",
              "is_deleted",
              "created_at",
              "updated_at",
              "deleted_at",
            ])
            .limit(limit)
            .offset(offset)
            .execute(),
          baseQuery
            .select((eb) => eb.fn.countAll().as("count"))
            .clearLimit()
            .clearOffset()
            .executeTakeFirst(),
        ]);

        const posts = postRows.map((row) => ({
          guid: row.guid,
          author_username: row.author_username,
          content: row.content,
          in_reply_to: row.in_reply_to ?? null,
          is_deleted: row.is_deleted,
          created_at: row.created_at,
          updated_at: row.updated_at ?? null,
          deleted_at: row.deleted_at ?? null,
        }));

        return {
          posts,
          total: Number(totalResult?.count ?? 0),
          page,
          limit,
        };
      },
      {
        posts: [],
        total: 0,
        page: 1,
        limit: params.limit ?? 20,
      },
    );
  }

  async findByGuid(guid: string): Promise<AdminPostRecord | undefined> {
    return this.safeQuery(async () => {
      const row = await this.db
        .selectFrom("posts")
        .select([
          "guid",
          "author_username",
          "content",
          "in_reply_to",
          "is_deleted",
          "created_at",
          "updated_at",
          "deleted_at",
        ])
        .where("guid", "=", guid)
        .where("is_deleted", "=", 0)
        .executeTakeFirst();

      if (!row) {
        return undefined;
      }

      return {
        guid: row.guid,
        author_username: row.author_username,
        content: row.content,
        in_reply_to: row.in_reply_to ?? null,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at ?? null,
        deleted_at: row.deleted_at ?? null,
      };
    }, undefined);
  }

  async deleteByGuid(guid: string): Promise<number> {
    return this.safeQuery(async () => {
      const result = await this.db
        .updateTable("posts")
        .set({
          is_deleted: 1,
          deleted_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        })
        .where("guid", "=", guid)
        .where("is_deleted", "=", 0)
        .executeTakeFirst();

      return Number(result.numUpdatedRows ?? 0);
    }, 0);
  }

  async updateByGuid(
    guid: string,
    updates: Partial<Pick<AdminPostRecord, "content" | "is_deleted">>,
  ): Promise<number> {
    return this.safeQuery(async () => {
      const updateData: {
        updated_at: number;
        content?: string;
        is_deleted?: number;
      } = {
        updated_at: Math.floor(Date.now() / 1000),
      };

      if (updates.content !== undefined) {
        updateData.content = updates.content;
      }
      if (updates.is_deleted !== undefined) {
        updateData.is_deleted = updates.is_deleted;
      }

      const result = await this.db
        .updateTable("posts")
        .set(updateData)
        .where("guid", "=", guid)
        .executeTakeFirst();

      return Number(result.numUpdatedRows ?? 0);
    }, 0);
  }
}
