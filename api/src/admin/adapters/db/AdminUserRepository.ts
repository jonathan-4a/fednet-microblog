// src/admin/adapters/db/AdminUserRepository.ts

import type { Kysely } from "kysely";
import type { UsersTable } from "@users";
import type {
  IAdminUserRepository,
  AdminUserRecord,
  UserListFilters,
  PaginatedUsers,
} from "../../ports/out/IAdminUserRepository";

export class AdminUserRepository<
  DB extends { users: UsersTable } = { users: UsersTable },
> implements IAdminUserRepository {
  private readonly db: Kysely<{ users: UsersTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ users: UsersTable }>;
  }

  async countAll(): Promise<number> {
    const result = await this.db
      .selectFrom("users")
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async countActive(): Promise<number> {
    const result = await this.db
      .selectFrom("users")
      .select((eb) => eb.fn.countAll().as("count"))
      .where("is_active", "=", 1)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async findRecent(limit = 10): Promise<AdminUserRecord[]> {
    return this.db
      .selectFrom("users")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(limit)
      .execute();
  }

  async findWithFilters(
    filters: UserListFilters = {},
  ): Promise<PaginatedUsers> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const offset = (page - 1) * limit;
    const sortBy =
      filters.sortBy &&
      ["username", "display_name", "created_at", "is_active"].includes(
        filters.sortBy,
      )
        ? filters.sortBy
        : "created_at";
    const sortOrder =
      filters.sortOrder && filters.sortOrder.toLowerCase() === "asc"
        ? "asc"
        : "desc";

    let baseQuery = this.db.selectFrom("users");

    if (filters.search) {
      const pattern = `%${filters.search}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("username", "like", pattern),
          eb("display_name", "like", pattern),
        ]),
      );
    }

    if (filters.status === "active") {
      baseQuery = baseQuery.where("is_active", "=", 1);
    } else if (filters.status === "inactive") {
      baseQuery = baseQuery.where("is_active", "=", 0);
    }

    const usersQuery = baseQuery
      .selectAll()
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    const countQuery = baseQuery.select((eb) => eb.fn.countAll().as("count"));

    const [users, totalResult] = await Promise.all([
      usersQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      users,
      total: Number(totalResult?.count ?? 0),
      page,
      limit,
    };
  }

  async findByUsername(username: string): Promise<AdminUserRecord | undefined> {
    return this.db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();
  }

  async updateUserStatus(username: string, isActive: 0 | 1): Promise<void> {
    await this.db
      .updateTable("users")
      .set({ is_active: isActive })
      .where("username", "=", username)
      .execute();
  }

  async deleteUser(username: string): Promise<number> {
    const result = await this.db
      .deleteFrom("users")
      .where("username", "=", username)
      .executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }
}
