import { describe, it, expect, mock, beforeEach } from "bun:test";
import { InviteTokenRepository } from "@auth";

describe("InviteTokenRepository Unit Tests", () => {
  let mockDb: any;
  let repository: InviteTokenRepository;

  beforeEach(() => {
    mockDb = {
      insertInto: mock(() => mockDb),
      values: mock(() => mockDb),
      returningAll: mock(() => mockDb),
      executeTakeFirstOrThrow: mock(() => Promise.resolve({ token: "mock-token" })),
      selectFrom: mock(() => mockDb),
      selectAll: mock(() => mockDb),
      where: mock(() => mockDb),
      executeTakeFirst: mock(() => Promise.resolve(undefined)),
      execute: mock(() => Promise.resolve([])),
      updateTable: mock(() => mockDb),
      set: mock(() => mockDb)
    };

    repository = new InviteTokenRepository(mockDb);
  });

  it("should create a token", async () => {
    const result = await repository.createToken("admin");

    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(mockDb.insertInto).toHaveBeenCalledWith("invite_tokens");
    expect(mockDb.values).toHaveBeenCalled();
  });

  it("should find an existing token", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      token: "found-token",
      status: "unused"
    });

    const result = await repository.findToken("found-token");

    expect(result).toBeDefined();
    expect(result?.token).toBe("found-token");
    expect(mockDb.selectFrom).toHaveBeenCalledWith("invite_tokens");
    expect(mockDb.where).toHaveBeenCalledWith("token", "=", "found-token");
  });

  it("should mark token as used if it was unused", async () => {
    // Mock the update result with numUpdatedRows
    mockDb.executeTakeFirst.mockResolvedValueOnce({ numUpdatedRows: 1n });

    const result = await repository.markTokenUsed({ token: "token1", usedBy: "user1" });
    expect(result).toBe(true);
    
    expect(mockDb.updateTable).toHaveBeenCalledWith("invite_tokens");
    expect(mockDb.set).toHaveBeenCalled();
  });
});

