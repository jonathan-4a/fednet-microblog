import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "@meck93/kysely-bun-sqlite";
import { Database } from "bun:sqlite";

import {
  createTokenBlacklistSchema,
  type TokenBlacklistTable,
  TokenBlacklistRepository,
} from "@auth";

interface TestDatabase {
  token_blacklist: TokenBlacklistTable;
}

describe("TokenBlacklistRepository Integration", () => {
  let db: Kysely<TestDatabase>;
  let repository: TokenBlacklistRepository;

  beforeAll(async () => {
    const sqlite = new Database(":memory:");
    db = new Kysely<TestDatabase>({
      dialect: new BunSqliteDialect({ database: sqlite }),
    });

    await createTokenBlacklistSchema(db as any);
    repository = new TokenBlacklistRepository(db as any);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("should add a token and confirm it is blacklisted", async () => {
    const token = "bad-token-123";
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    await repository.addToken(token, expiresAt);

    const isBlacklisted = await repository.isTokenBlacklisted(token);
    expect(isBlacklisted).toBe(true);
  });

  it("should return false for a token that is not blacklisted", async () => {
    const isBlacklisted = await repository.isTokenBlacklisted("good-token-123");
    expect(isBlacklisted).toBe(false);
  });

  it("should clean up expired tokens", async () => {
    const token1 = "expired-token";
    const token2 = "valid-token";
    const nowTimestamp = Math.floor(Date.now() / 1000);

    // Add an expired token
    await repository.addToken(token1, nowTimestamp - 3600); // 1 hour ago
    
    // Add a valid token
    await repository.addToken(token2, nowTimestamp + 3600); // 1 hour from now

    // Before cleanup, both should be "blacklisted"
    expect(await repository.isTokenBlacklisted(token1)).toBe(true);
    expect(await repository.isTokenBlacklisted(token2)).toBe(true);

    // Run cleanup
    await repository.cleanupExpiredTokens();

    // After cleanup, the expired one should be removed
    expect(await repository.isTokenBlacklisted(token1)).toBe(false);
    expect(await repository.isTokenBlacklisted(token2)).toBe(true); // Should still exist
  });
});

