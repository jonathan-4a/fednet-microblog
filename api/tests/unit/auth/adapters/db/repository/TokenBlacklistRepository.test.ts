import { describe, it, expect, mock, beforeEach } from "bun:test";
import { TokenBlacklistRepository } from "@auth";

describe("TokenBlacklistRepository Unit Tests", () => {
  let mockDb: any;
  let repository: TokenBlacklistRepository;

  beforeEach(() => {
    mockDb = {
      insertInto: mock(() => mockDb),
      values: mock(() => mockDb),
      execute: mock(() => Promise.resolve()),
      selectFrom: mock(() => mockDb),
      select: mock(() => mockDb),
      where: mock(() => mockDb),
      executeTakeFirst: mock(() => Promise.resolve(undefined)),
      deleteFrom: mock(() => mockDb)
    };

    repository = new TokenBlacklistRepository(mockDb);
  });

  it("should add a token", async () => {
    await repository.addToken("test-token", 1000);

    expect(mockDb.insertInto).toHaveBeenCalledWith("token_blacklist");
    expect(mockDb.values).toHaveBeenCalled();
    expect(mockDb.execute).toHaveBeenCalled();
  });

  it("should return true if token is blacklisted", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ token: "test-token" });

    const result = await repository.isTokenBlacklisted("test-token");
    expect(result).toBe(true);

    expect(mockDb.selectFrom).toHaveBeenCalledWith("token_blacklist");
    expect(mockDb.where).toHaveBeenCalledWith("token", "=", "test-token");
  });

  it("should return false if token is not blacklisted", async () => {
    // defaults to undefined
    const result = await repository.isTokenBlacklisted("test-token");
    expect(result).toBe(false);
  });

  it("should cleanup expired tokens", async () => {
    await repository.cleanupExpiredTokens();

    expect(mockDb.deleteFrom).toHaveBeenCalledWith("token_blacklist");
    expect(mockDb.where).toHaveBeenCalledWith(
      "expires_at",
      "<=",
      expect.any(Number),
    );
    expect(mockDb.execute).toHaveBeenCalled();
  });
});

