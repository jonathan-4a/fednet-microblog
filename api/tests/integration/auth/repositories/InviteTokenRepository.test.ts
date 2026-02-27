import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "@meck93/kysely-bun-sqlite";
import { Database } from "bun:sqlite";

import {
  createInviteTokensSchema,
  type InviteTokensTable,
  InviteTokenRepository,
} from "@auth";

interface TestDatabase {
  invite_tokens: InviteTokensTable;
}

describe("InviteTokenRepository Integration", () => {
  let db: Kysely<TestDatabase>;
  let repository: InviteTokenRepository;

  beforeAll(async () => {
    const sqlite = new Database(":memory:");
    db = new Kysely<TestDatabase>({
      dialect: new BunSqliteDialect({ database: sqlite }),
    });

    await createInviteTokensSchema(db as any);
    repository = new InviteTokenRepository(db as any);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("should create a token successfully", async () => {
    const record = await repository.createToken("admin-user");

    expect(record.token).toBeDefined();
    expect(record.created_by).toBe("admin-user");
    expect(record.status).toBe("unused");
    expect(record.created_at).toBeGreaterThan(0);
    expect(record.used_at).toBeNull();
    expect(record.used_by).toBeNull();
  });

  it("should find an existing token", async () => {
    const created = await repository.createToken("admin-user-2");
    
    const found = await repository.findToken(created.token);
    expect(found).toBeDefined();
    expect(found?.token).toBe(created.token);
    expect(found?.status).toBe("unused");
  });

  it("should return undefined for non-existent token", async () => {
    const found = await repository.findToken("fake-token");
    expect(found).toBeUndefined();
  });

  it("should mark a token as used", async () => {
    const created = await repository.createToken("admin-user-3");
    
    const marked = await repository.markTokenUsed({
      token: created.token,
      usedBy: "new-registered-user"
    });
    expect(marked).toBe(true);

    const found = await repository.findToken(created.token);
    expect(found?.status).toBe("used");
    expect(found?.used_by).toBe("new-registered-user");
    expect(found?.used_at).toBeGreaterThan(0);
  });

  it("should block marking an already used token as used again", async () => {
    const created = await repository.createToken("admin-user-4");
    
    await repository.markTokenUsed({
      token: created.token,
      usedBy: "user1"
    });

    const secondTime = await repository.markTokenUsed({
      token: created.token,
      usedBy: "user2"
    });

    expect(secondTime).toBe(false);
  });

  it("should successfully list tokens by creator and list all tokens", async () => {
    await repository.createToken("admin1");
    await repository.createToken("admin2");

    const admin1Tokens = await repository.listTokensByCreator("admin1");
    // At least 1 (since the first test also used admin-user, etc.)
    expect(admin1Tokens.length).toBeGreaterThanOrEqual(1);

    const allTokens = await repository.listAllTokens();
    expect(allTokens.length).toBeGreaterThanOrEqual(2);
  });

  it("should revoke an unused token", async () => {
    const created = await repository.createToken("admin-revoke");
    
    const revoked = await repository.revokeToken(created.token);
    expect(revoked).toBe(true);

    const found = await repository.findToken(created.token);
    expect(found?.status).toBe("revoked");
  });
});

