import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CredentialsRepository } from "../../../../../../src/auth/adapters/db/repository/CredentialsRepository";

describe("CredentialsRepository Unit Tests", () => {
  let mockDb: any;
  let repository: CredentialsRepository;

  beforeEach(() => {
    mockDb = {
      selectFrom: mock(() => mockDb),
      selectAll: mock(() => mockDb),
      where: mock(() => mockDb),
      executeTakeFirst: mock(() => Promise.resolve(undefined)),
      insertInto: mock(() => mockDb),
      values: mock(() => mockDb),
      execute: mock(() => Promise.resolve())
    };

    repository = new CredentialsRepository(mockDb);
  });

  it("should find credentials by username", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      username: "testuser",
      password_hash: "hash",
      public_key_pem: "pub",
      privkey: "priv"
    });

    const result = await repository.findCredentialsByUsername("testuser");

    expect(result).toBeDefined();
    expect(result?.username).toBe("testuser");
    expect(result?.passwordHash).toBe("hash");
    
    expect(mockDb.selectFrom).toHaveBeenCalledWith("credentials");
    expect(mockDb.where).toHaveBeenCalledWith("username", "=", "testuser");
  });

  it("should create credentials", async () => {
    const creds = {
      username: "testuser",
      passwordHash: "hash",
      publicKeyPem: "pub",
      privkey: "priv",
    };

    await repository.createCredentials(undefined as any, creds as any);

    expect(mockDb.insertInto).toHaveBeenCalledWith("credentials");
    expect(mockDb.values).toHaveBeenCalledWith({
      username: "testuser",
      password_hash: "hash",
      public_key_pem: "pub",
      privkey: "priv"
    });
    expect(mockDb.execute).toHaveBeenCalled();
  });
});

