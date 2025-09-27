// src/auth/adapters/db/repository/CredentialsRepository.ts
import type { Kysely } from "kysely";
import type { CredentialsTable } from "../models/CredentialsSchema";
import type { Credentials } from "../../../domain/Credentials";
import type { ICredentialsRepository } from "../../../ports/out/repository/ICredentialsRepository";
import { AuthInternalServerError } from "../../../domain/AuthErrors";

type Transaction = Kysely<{ credentials: CredentialsTable }>;

export class CredentialsRepository implements ICredentialsRepository {
  constructor(private readonly db: Kysely<{ credentials: CredentialsTable }>) {}

  private getDb(trx?: Transaction) {
    return trx ?? this.db;
  }

  async findCredentialsByUsername(
    username: string,
  ): Promise<Credentials | undefined> {
    const result = await this.db
      .selectFrom("credentials")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    return result ? this.toDomain(result) : undefined;
  }

  async createCredentials(
    trx: Transaction | undefined,
    credentials: Credentials,
  ): Promise<void> {
    if (!credentials.passwordHash || !credentials.publicKeyPem) {
      throw new AuthInternalServerError(
        "Internal failure: missing required credential fields",
      );
    }

    await this.getDb(trx)
      .insertInto("credentials")
      .values(this.toTable(credentials))
      .execute();
  }

  private toDomain(table: CredentialsTable): Credentials {
    if (!table.password_hash || !table.public_key_pem) {
      throw new AuthInternalServerError(
        `Data Integrity Error: Credentials for ${table.username} are corrupted in database`,
      );
    }

    return {
      username: table.username,
      passwordHash: table.password_hash,
      publicKeyPem: table.public_key_pem,
      privkey: table.privkey,
    };
  }

  private toTable(domain: Credentials) {
    return {
      username: domain.username,
      password_hash: domain.passwordHash,
      public_key_pem: domain.publicKeyPem,
      privkey: domain.privkey,
    };
  }
}

