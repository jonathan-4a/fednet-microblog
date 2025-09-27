// src/auth/adapters/db/repository/InviteTokenRepository.ts
import { randomBytes } from "crypto";
import type { Kysely } from "kysely";
import type { InviteTokensTable } from "../models/InviteTokenSchema";
import type {
  IInviteTokenRepository,
  InviteTokenRecord,
} from "../../../ports/out/repository/IInviteTokenRepository";
import type { InviteToken } from "../../../domain/InviteToken";

type Transaction = Kysely<{ invite_tokens: InviteTokensTable }>;

export class InviteTokenRepository implements IInviteTokenRepository {
  constructor(
    private readonly db: Kysely<{ invite_tokens: InviteTokensTable }>,
  ) {}

  private getDb(trx?: Transaction) {
    return trx ?? this.db;
  }

  async findToken(
    token: string,
    trx?: Transaction,
  ): Promise<InviteTokenRecord | undefined> {
    const result = await this.getDb(trx)
      .selectFrom("invite_tokens")
      .selectAll()
      .where("token", "=", token)
      .executeTakeFirst();

    return result ? this.toRecord(this.toDomain(result)) : undefined;
  }

  async markTokenUsed(
    params: { token: string; usedBy: string },
    trx?: Transaction,
  ): Promise<boolean> {
    const result = await this.getDb(trx)
      .updateTable("invite_tokens")
      .set({
        status: "used",
        used_at: Math.floor(Date.now() / 1000),
        used_by: params.usedBy,
      })
      .where("token", "=", params.token)
      .where("status", "=", "unused")
      .executeTakeFirst();

    return (result.numUpdatedRows ?? 0) > 0;
  }

  async createToken(
    createdBy: string,
    trx?: Transaction,
  ): Promise<InviteTokenRecord> {
    const token = randomBytes(32).toString("hex");
    const createdAt = Math.floor(Date.now() / 1000);

    await this.getDb(trx)
      .insertInto("invite_tokens")
      .values({
        token,
        created_by: createdBy,
        status: "unused",
        created_at: createdAt,
        used_at: null,
        used_by: null,
      })
      .execute();

    return {
      token,
      created_by: createdBy,
      status: "unused",
      created_at: createdAt,
      used_at: null,
      used_by: null,
    };
  }

  async listTokensByCreator(createdBy: string): Promise<InviteTokenRecord[]> {
    const results = await this.db
      .selectFrom("invite_tokens")
      .selectAll()
      .where("created_by", "=", createdBy)
      .execute();

    return results.map((r) => this.toRecord(this.toDomain(r)));
  }

  async listAllTokens(): Promise<InviteTokenRecord[]> {
    const results = await this.db
      .selectFrom("invite_tokens")
      .selectAll()
      .execute();
    return results.map((r) => this.toRecord(this.toDomain(r)));
  }

  async revokeToken(token: string, trx?: Transaction): Promise<boolean> {
    const result = await this.getDb(trx)
      .updateTable("invite_tokens")
      .set({ status: "revoked" })
      .where("token", "=", token)
      .where("status", "=", "unused")
      .executeTakeFirst();

    return (result.numUpdatedRows ?? 0) > 0;
  }

  private toDomain(table: InviteTokensTable): InviteToken {
    return {
      token: table.token,
      createdBy: table.created_by,
      status: table.status,
      createdAt: table.created_at,
      usedAt: table.used_at,
      usedBy: table.used_by,
    };
  }

  private toRecord(domain: InviteToken): InviteTokenRecord {
    return {
      token: domain.token,
      created_by: domain.createdBy,
      status: domain.status,
      created_at: domain.createdAt,
      used_at: domain.usedAt,
      used_by: domain.usedBy,
    };
  }
}

