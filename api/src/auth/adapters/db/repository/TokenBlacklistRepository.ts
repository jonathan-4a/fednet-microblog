// src/auth/adapters/db/repository/TokenBlacklistRepository.ts
import type { Kysely } from "kysely";
import type { TokenBlacklistTable } from "../models/TokenBlacklistSchema";
import type { ITokenBlacklistRepository } from "../../../ports/out/repository/ITokenBlacklistRepository";

type Transaction = Kysely<{ token_blacklist: TokenBlacklistTable }>;

export class TokenBlacklistRepository implements ITokenBlacklistRepository {
  constructor(
    private readonly db: Kysely<{ token_blacklist: TokenBlacklistTable }>,
  ) {}

  private getDb(trx?: Transaction) {
    return trx ?? this.db;
  }

  async addToken(
    token: string,
    expiresAt: number,
    trx?: Transaction,
  ): Promise<void> {
    await this.getDb(trx)
      .insertInto("token_blacklist")
      .values({
        token,
        expires_at: expiresAt,
        created_at: Math.floor(Date.now() / 1000),
      })
      .execute();
  }

  async isTokenBlacklisted(token: string, trx?: Transaction): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.getDb(trx)
      .selectFrom("token_blacklist")
      .select("token")
      .where("token", "=", token)
      .where("expires_at", ">", now)
      .executeTakeFirst();

    return !!result;
  }

  async cleanupExpiredTokens(trx?: Transaction): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.getDb(trx)
      .deleteFrom("token_blacklist")
      .where("expires_at", "<=", now)
      .execute();
  }
}

