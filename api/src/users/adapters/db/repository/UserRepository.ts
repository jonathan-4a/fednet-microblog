// src/users/adapters/db/repository/UserRepository.ts
import type { Kysely } from "kysely";
import type {
  CreateUserInput,
  UpdateUserFlagsInput,
} from "../../../ports/in/Users.dto";
import type { IUserRepository } from "../../../ports/out/IUserRepository";
import { UserEntity } from "../../../domain/UserEntity";
import type { UsersTable } from "../models/UserSchema";

type Transaction = Kysely<{ users: UsersTable }>;

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<{ users: UsersTable }>) {}

  private getDb(trx?: Transaction) {
    return trx ?? this.db;
  }

  async createUser(input: CreateUserInput, trx?: Transaction) {
    const userEntity = new UserEntity(input);

    await this.getDb(trx)
      .insertInto("users")
      .values(this.toTable(userEntity))
      .execute();
  }

  async findUserByUsername(username: string) {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    return row ? this.toDomain(row).toData() : undefined;
  }

  async updateUserFlags(input: UpdateUserFlagsInput, trx?: Transaction) {
    const updates: Partial<UsersTable> = {};
    if (input.isAdmin !== undefined) updates.is_admin = input.isAdmin ? 1 : 0;
    if (input.isActive !== undefined)
      updates.is_active = input.isActive ? 1 : 0;
    if (input.isFollowingPublic !== undefined)
      updates.is_following_public = input.isFollowingPublic ? 1 : 0;

    if (!Object.keys(updates).length) return;

    await this.getDb(trx)
      .updateTable("users")
      .set(updates)
      .where("username", "=", input.username)
      .execute();
  }

  async updateUserProfile(user: CreateUserInput, trx?: Transaction) {
    await this.getDb(trx)
      .updateTable("users")
      .set({
        display_name: user.displayName,
        summary: user.summary,
        is_following_public: user.isFollowingPublic ? 1 : 0,
      })
      .where("username", "=", user.username)
      .execute();
  }

  async deleteUser(username: string, trx?: Transaction) {
    const result = await this.getDb(trx)
      .deleteFrom("users")
      .where("username", "=", username)
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }

  async searchUsers(query: string, limit = 5, excludeUsername?: string) {
    const qb = this.db
      .selectFrom("users")
      .selectAll()
      .where("username", "like", `%${query}%`)
      .where("is_active", "=", 1);

    if (excludeUsername) qb.where("username", "!=", excludeUsername);

    const rows = await qb.orderBy("username", "asc").limit(limit).execute();
    return rows.map((row) => this.toDomain(row).toData());
  }

  private toDomain(row: UsersTable): UserEntity {
    return new UserEntity({
      username: row.username,
      displayName: row.display_name,
      summary: row.summary,
      isActive: row.is_active === 1,
      isAdmin: row.is_admin === 1,
      isFollowingPublic: row.is_following_public === 1,
      createdAt: row.created_at,
    });
  }

  private toTable(user: UserEntity): UsersTable {
    return {
      username: user.username,
      display_name: user.displayName,
      summary: user.summary,
      is_active: user.isActive ? 1 : 0,
      is_admin: user.isAdmin ? 1 : 0,
      is_following_public: user.isFollowingPublic ? 1 : 0,
      created_at: user.createdAt,
    };
  }
}
