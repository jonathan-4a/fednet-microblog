import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "@meck93/kysely-bun-sqlite";
import { Database } from "bun:sqlite";

import {
  createCredentialsSchema,
  type CredentialsTable,
  CredentialsRepository,
} from "@auth";
import {
  createUserSchema,
  type UsersTable,
} from "@users/adapters/db/models/UserSchema";

interface TestDatabase {
  users: UsersTable;
  credentials: CredentialsTable;
}

describe("CredentialsRepository Integration", () => {
  let db: Kysely<TestDatabase>;
  let repository: CredentialsRepository;

  beforeAll(async () => {
    // Setup in-memory SQLite database
    const sqlite = new Database(":memory:");
    db = new Kysely<TestDatabase>({
      dialect: new BunSqliteDialect({ database: sqlite }),
    });

    // Create required tables
    await createUserSchema(db as any);
    await createCredentialsSchema(db as any);

    repository = new CredentialsRepository(db as any);

    // Insert a dummy user so foreign key constraint passes
    await db.insertInto("users").values({
      username: "testuser",
      display_name: "Test User",
      summary: "A test user",
      is_active: 1,
      is_admin: 0,
      is_following_public: 1,
      created_at: Date.now()
    }).execute();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("should create credentials and retrieve them by username", async () => {
    const creds = {
      username: "testuser",
      passwordHash: "salt123:hash456",
      publicKeyPem: "pub-key-pem",
      privateKey: "priv-key"
    };

    // Use dummy transaction representation (the repository just uses the Kysely instance if transaction isn't valid)
    await repository.createCredentials(db, creds);

    const retrieved = await repository.findCredentialsByUsername("testuser");

    expect(retrieved).toBeDefined();
    expect(retrieved?.username).toBe("testuser");
    expect(retrieved?.passwordHash).toBe("salt123:hash456");
    expect(retrieved?.publicKeyPem).toBe("pub-key-pem");
    expect(retrieved?.privateKey).toBe("priv-key");
  });

  it("should return undefined for a username that does not exist", async () => {
    const retrieved = await repository.findCredentialsByUsername("unknownuser");
    expect(retrieved).toBeUndefined();
  });
});

